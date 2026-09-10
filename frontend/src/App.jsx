import React, { useState, useEffect } from 'react';
import Navbar from './components/Layout/Navbar';
import FilterSlicers from './components/Dashboard/FilterSlicers';
import KpiCards from './components/Dashboard/KpiCards';
import EfficiencyRankingChart from './components/Dashboard/EfficiencyRankingChart';
import ConsumptionTimelineChart from './components/Dashboard/ConsumptionTimelineChart';
import ExpensesDonutChart from './components/Dashboard/ExpensesDonutChart';
import ArlaAuditChart from './components/Dashboard/ArlaAuditChart';
import DataTableMatrix from './components/Dashboard/DataTableMatrix';
import SideBySideReviewModal from './components/Ingestion/SideBySideReviewModal';
import FastManualEntryGrid from './components/Ingestion/FastManualEntryGrid';
import DriverMobilePwa from './components/DriverApp/DriverMobilePwa';
import FleetManagement from './components/Fleet/FleetManagement';

import {
  fetchKpis,
  fetchRanking,
  fetchEvolucao,
  fetchDespesasCategorias,
  fetchAuditoriaArla,
  fetchAbastecimentos,
  fetchDespesas,
  fetchVeiculos,
  deleteAbastecimento,
  deleteDespesa,
  API_BASE_URL
} from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [apiOnline, setApiOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  // Global Slicers / Filters
  const [filters, setFilters] = useState({
    ano: 2026,
    mes: null,
    veiculo_id: null,
    categoria: null
  });

  // Data state
  const [veiculos, setVeiculos] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [evolucao, setEvolucao] = useState([]);
  const [despesasCategorias, setDespesasCategorias] = useState([]);
  const [auditoriaArla, setAuditoriaArla] = useState([]);
  const [abastecimentos, setAbastecimentos] = useState([]);
  const [despesas, setDespesas] = useState([]);

  // Load Vehicles once on mount
  useEffect(() => {
    fetchVeiculos()
      .then(data => {
        setVeiculos(data);
        setApiOnline(true);
      })
      .catch(err => {
        console.error('API connection check failed', err);
        setApiOnline(false);
      });
  }, []);

  // Reload analytics whenever filters change or on refresh
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [
        kpisData,
        rankingData,
        evolucaoData,
        despesasCatData,
        arlaData,
        abastsData,
        despsData
      ] = await Promise.all([
        fetchKpis(filters),
        fetchRanking(filters),
        fetchEvolucao(filters),
        fetchDespesasCategorias(filters),
        fetchAuditoriaArla(filters),
        fetchAbastecimentos(filters),
        fetchDespesas(filters)
      ]);

      setKpis(kpisData);
      setRanking(rankingData);
      setEvolucao(evolucaoData);
      setDespesasCategorias(despesasCatData);
      setAuditoriaArla(arlaData);
      setAbastecimentos(abastsData);
      setDespesas(despsData);
      setApiOnline(true);
    } catch (e) {
      console.error('Error loading dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [filters]);

  // Cross-filtering click on Truck
  const handleSelectTruckFromChart = (plate) => {
    const v = veiculos.find(item => item.placa === plate);
    if (v) {
      setFilters(prev => ({
        ...prev,
        veiculo_id: prev.veiculo_id === v.id ? null : v.id
      }));
    }
  };

  // Cross-filtering click on Expense Category
  const handleSelectCategoryFromChart = (cat) => {
    setFilters(prev => ({
      ...prev,
      categoria: prev.categoria === cat ? null : cat
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      ano: 2026,
      mes: null,
      veiculo_id: null,
      categoria: null
    });
  };

  const handleDeleteAbastecimento = async (id) => {
    if (window.confirm('Deseja realmente remover este registro de abastecimento?')) {
      await deleteAbastecimento(id);
      loadDashboardData();
    }
  };

  const handleDeleteDespesa = async (id) => {
    if (window.confirm('Deseja realmente remover este lançamento de despesa?')) {
      await deleteDespesa(id);
      loadDashboardData();
    }
  };

  const handleExportCsv = () => {
    if (!abastecimentos || abastecimentos.length === 0) return;
    const headers = ['ID', 'Placa', 'Data', 'KM Inicial', 'KM Final', 'KM Rodado', 'Litros Diesel', 'Litros ARLA', 'Valor Total', 'Media KM/L', 'Custo/KM', 'Origem'];
    const rows = abastecimentos.map(a => [
      a.id,
      a.placa,
      a.data,
      a.km_inicial || '',
      a.km_final,
      a.km_rodado,
      a.litros_diesel,
      a.litros_arla || 0,
      a.valor_total_nota,
      a.media_km_l || '',
      a.custo_km_diesel || '',
      a.origem_registro
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `scucel_abastecimentos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        apiOnline={apiOnline}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '0 1.25rem 2rem 1.25rem' }}>
        
        {/* TAB 1: POWER BI ANALYTICAL DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            
            {/* Global Slicers */}
            <FilterSlicers
              filters={filters}
              setFilters={setFilters}
              veiculos={veiculos}
              onReset={handleResetFilters}
              onExportCsv={handleExportCsv}
            />

            {/* KPI Ribbon */}
            <KpiCards kpis={kpis} />

            {/* Row 1 Charts: Ranking KM/L + Monthly Evolution */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
              gap: '1.25rem',
              marginBottom: '1.25rem'
            }}>
              <EfficiencyRankingChart
                ranking={ranking}
                onSelectTruck={handleSelectTruckFromChart}
                selectedVehicleId={filters.veiculo_id}
              />
              <ConsumptionTimelineChart evolucao={evolucao} />
            </div>

            {/* Row 2 Charts: Expenses Donut + Arla 32 Audit */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
              gap: '1.25rem',
              marginBottom: '1.25rem'
            }}>
              <ExpensesDonutChart
                despesasCategorias={despesasCategorias}
                onSelectCategory={handleSelectCategoryFromChart}
              />
              <ArlaAuditChart auditoriaArla={auditoriaArla} />
            </div>

            {/* Drill-down Data Grid */}
            <DataTableMatrix
              abastecimentos={abastecimentos}
              despesas={despesas}
              onDeleteAbastecimento={handleDeleteAbastecimento}
              onDeleteDespesa={handleDeleteDespesa}
            />

          </div>
        )}

        {/* TAB 2: SIDE BY SIDE AI REVIEW (WHATSAPP PHOTO) */}
        {activeTab === 'ia-vision' && (
          <div className="animate-fade-in">
            <SideBySideReviewModal
              veiculos={veiculos}
              onSuccessSave={() => {
                loadDashboardData();
              }}
            />
          </div>
        )}

        {/* TAB 3: FAST MANUAL ENTRY (FERNANDA) */}
        {activeTab === 'manual-entry' && (
          <div className="animate-fade-in">
            <FastManualEntryGrid
              veiculos={veiculos}
              onSuccessSave={() => {
                loadDashboardData();
              }}
            />
          </div>
        )}

        {/* TAB 4: DRIVER MOBILE APP (OFFLINE PWA) */}
        {activeTab === 'driver-app' && (
          <div className="animate-fade-in">
            <DriverMobilePwa
              veiculos={veiculos}
              onSyncSuccess={() => {
                loadDashboardData();
              }}
            />
          </div>
        )}

        {/* TAB 5: FLEET MANAGEMENT */}
        {activeTab === 'fleet' && (
          <div className="animate-fade-in">
            <FleetManagement
              veiculos={veiculos}
              onRefresh={() => {
                fetchVeiculos().then(setVeiculos);
                loadDashboardData();
              }}
            />
          </div>
        )}

      </main>

    </div>
  );
}
