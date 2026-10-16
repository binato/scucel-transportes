import unittest

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.database import Base, get_db
from backend.app.models import Veiculo, Abastecimento
from backend.app.routers import abastecimentos, despesas


class FuelCrudTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
        Base.metadata.create_all(self.engine)
        self.session_factory = sessionmaker(bind=self.engine)
        with self.session_factory() as db:
            db.add(Veiculo(placa="ABC1D23", meta_km_l=3.0))
            db.commit()
        app = FastAPI()
        app.include_router(abastecimentos.router)
        app.include_router(despesas.router)

        def db_override():
            with self.session_factory() as session:
                yield session

        app.dependency_overrides[get_db] = db_override
        self.client = TestClient(app)

    def tearDown(self):
        self.client.close()
        Base.metadata.drop_all(self.engine)
        self.engine.dispose()

    def entry(self, day, km, **extra):
        return {"veiculo_id": 1, "data": f"2026-10-{day:02d}", "km_final": km,
                "litros_diesel": 100, "litros_arla": 0, "valor_total_nota": 500, **extra}

    def post(self, payload):
        result = self.client.post("/api/abastecimentos", json=payload)
        self.assertEqual(result.status_code, 200, result.text)
        return result.json()

    def test_retroactive_create_edit_delete_recalculates_neighbor(self):
        first = self.post(self.entry(1, 1000, km_inicial=900))
        preserved = self.client.put(f"/api/abastecimentos/{first['id']}", json=self.entry(1, 1050, km_inicial=900))
        self.assertEqual(preserved.status_code, 200, preserved.text)
        self.assertEqual(preserved.json()["km_rodado"], 150)
        last = self.post(self.entry(10, 2000))
        middle = self.post(self.entry(5, 1500))
        self.assertEqual(middle["km_rodado"], 450)
        self.assertEqual(self.client.get("/api/abastecimentos").json()[0]["km_rodado"], 500)
        edited = self.client.put(f"/api/abastecimentos/{middle['id']}", json=self.entry(5, 1600))
        self.assertEqual(edited.status_code, 200, edited.text)
        self.assertEqual(edited.json()["km_rodado"], 550)
        listed = self.client.get("/api/abastecimentos").json()
        self.assertEqual(next(row for row in listed if row["id"] == last["id"])["km_rodado"], 400)
        rejected = self.client.put(f"/api/abastecimentos/{middle['id']}", json=self.entry(5, 2200))
        self.assertEqual(rejected.status_code, 422)
        self.assertEqual(self.client.delete(f"/api/abastecimentos/{middle['id']}").status_code, 200)
        listed = self.client.get("/api/abastecimentos").json()
        self.assertEqual(next(row for row in listed if row["id"] == last["id"])["km_rodado"], 950)
        self.assertEqual(first["km_rodado"], 100)

    def test_expense_is_atomic_and_deleted_with_fuel(self):
        created = self.post(self.entry(2, 1200, despesa={"categoria": "PNEUS", "descricao": "Pneu", "valor": 50}))
        self.assertEqual(created["despesa"]["descricao"], "Pneu")
        expenses = self.client.get("/api/despesas").json()
        self.assertEqual(len(expenses), 1)
        self.assertEqual(expenses[0]["abastecimento_id"], created["id"])
        self.client.delete(f"/api/abastecimentos/{created['id']}")
        self.assertEqual(self.client.get("/api/despesas").json(), [])

    def test_client_id_prevents_duplicate_sync(self):
        payload = self.entry(3, 1300, client_id="offline-test-1")
        first = self.post(payload)
        second = self.post(payload)
        self.assertEqual(first["id"], second["id"])
        self.assertEqual(len(self.client.get("/api/abastecimentos").json()), 1)

    def test_legacy_zero_liters_remains_readable(self):
        from datetime import date
        with self.session_factory() as db:
            db.add(Abastecimento(veiculo_id=1, data=date(2026, 1, 1), km_inicial=100,
                                 km_final=200, km_rodado=100, litros_diesel=0,
                                 litros_arla=0, valor_total_nota=0, origem_registro="EXCEL_IMPORT"))
            db.commit()
        response = self.client.get('/api/abastecimentos')
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()[0]['litros_diesel'], 0)


if __name__ == "__main__":
    unittest.main()
