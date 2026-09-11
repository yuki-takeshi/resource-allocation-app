// Node.js バックエンドへのリクエストを処理する API クライアント

// Node.js サーバーの URL
const SERVER_URL = 'http://localhost:3001';

// ===== 受注残管理 API =====

export async function fetchOrders() {
  const response = await fetch(`${SERVER_URL}/api/orders`);
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

export async function saveOrder(data) {
  const response = await fetch(`${SERVER_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

export async function deleteOrder(id) {
  const response = await fetch(`${SERVER_URL}/api/orders/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

export async function fetchTargets() {
  const response = await fetch(`${SERVER_URL}/api/targets`);
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

export async function saveTarget(id, month, department, target) {
  const response = await fetch(`${SERVER_URL}/api/targets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, month, department, target })
  });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

export async function deleteTarget(id) {
  const response = await fetch(`${SERVER_URL}/api/targets/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

export async function fetchLog() {
  const response = await fetch(`${SERVER_URL}/api/log`);
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

export async function saveLog(id, timestamp, message, type) {
  const response = await fetch(`${SERVER_URL}/api/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, timestamp, message, type })
  });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

export async function fetchSnapshots() {
  const response = await fetch(`${SERVER_URL}/api/snapshots`);
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

export async function saveSnapshot(id, date, department, totalAmount, created_at) {
  const response = await fetch(`${SERVER_URL}/api/snapshots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, date, department, totalAmount, created_at })
  });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

// ===== アカウントプラン管理 API =====

export async function fetchAccountCategories() {
  const response = await fetch(`${SERVER_URL}/api/account-planning/categories`);
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

export async function saveAccountCategory(name) {
  const response = await fetch(`${SERVER_URL}/api/account-planning/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

export async function deleteAccountCategory(id) {
  const response = await fetch(`${SERVER_URL}/api/account-planning/categories/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

export async function fetchAccounts() {
  const response = await fetch(`${SERVER_URL}/api/account-planning/accounts`);
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

export async function saveAccount(data) {
  const response = await fetch(`${SERVER_URL}/api/account-planning/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

export async function deleteAccount(id) {
  const response = await fetch(`${SERVER_URL}/api/account-planning/accounts/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

export async function fetchAccountTarget() {
  const response = await fetch(`${SERVER_URL}/api/account-planning/settings/target`);
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

export async function saveAccountTarget(targetAmount) {
  const response = await fetch(`${SERVER_URL}/api/account-planning/settings/target`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetAmount })
  });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

export async function fetchCategoryTargets() {
  const response = await fetch(`${SERVER_URL}/api/account-planning/category-targets`);
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

export async function saveCategoryTarget(categoryId, targetAmount) {
  const response = await fetch(`${SERVER_URL}/api/account-planning/category-targets/${categoryId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetAmount })
  });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

// ===== Legacy APIs for ResourceAllocationApp (dummy implementations) =====

export async function fetchProjects() {
  return [];
}

export async function saveProject(data) {
  return { success: true };
}

export async function deleteProject(id) {
  return { success: true };
}

export async function fetchMembers() {
  return [];
}

export async function saveMember(data) {
  return { success: true };
}

export async function deleteMember(id) {
  return { success: true };
}

export async function saveAllocation(memberId, month, rate) {
  return { success: true };
}

export async function saveSkill(memberId, skill, level) {
  return { success: true };
}
