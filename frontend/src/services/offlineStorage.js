// LocalStorage offline sync engine for truck driver app

const STORAGE_KEY_PENDING = 'scucel_motorista_pending_records';
const STORAGE_KEY_LAST_VEHICLE = 'scucel_motorista_last_plate';

export function getPendingRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PENDING);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading offline storage', e);
    return [];
  }
}

export function savePendingRecord(record) {
  const list = getPendingRecords();
  const newRecord = {
    ...record,
    id_temp: 'offline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    created_at_local: new Date().toISOString(),
    status_sync: 'PENDENTE'
  };
  list.unshift(newRecord);
  localStorage.setItem(STORAGE_KEY_PENDING, JSON.stringify(list));
  return newRecord;
}

export function removePendingRecord(id_temp) {
  const list = getPendingRecords().filter(r => r.id_temp !== id_temp);
  localStorage.setItem(STORAGE_KEY_PENDING, JSON.stringify(list));
}

export function clearAllPendingRecords() {
  localStorage.removeItem(STORAGE_KEY_PENDING);
}

export function saveLastPlate(plate) {
  localStorage.setItem(STORAGE_KEY_LAST_VEHICLE, plate);
}

export function getLastPlate() {
  return localStorage.getItem(STORAGE_KEY_LAST_VEHICLE) || '';
}
