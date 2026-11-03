const STORAGE_KEY = 'procurio_demo_session';

const DEFAULT_SESSION = {
  role: 'procurement_buyer',
  portal: 'admin',
  supplier_id: 1,
};

export function readDemoSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SESSION };
    const parsed = JSON.parse(raw);
    return {
      role: parsed.role || DEFAULT_SESSION.role,
      portal: parsed.portal || DEFAULT_SESSION.portal,
      supplier_id: parsed.supplier_id ?? DEFAULT_SESSION.supplier_id,
    };
  } catch {
    return { ...DEFAULT_SESSION };
  }
}

export function writeDemoSession({ role, portal, supplier_id = 1 }) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ role, portal, supplier_id })
  );
}

export function demoSessionHeaders() {
  const s = readDemoSession();
  return {
    'X-Demo-Role': s.role,
    'X-Demo-Portal': s.portal,
    'X-Demo-Supplier-Id': String(s.supplier_id ?? 1),
  };
}
