/**
 * One-off local smoke: login per role and GET key pages.
 * Usage: node scripts/smoke-routes.mjs
 */
const BASE = process.env.SMOKE_BASE || "http://localhost:3000";

const roles = [
  {
    name: "owner",
    email: "owner@demo.tabellone.com",
    password: "demo1234",
    paths: [
      "/owner/dashboard",
      "/owner/profile/edit",
      "/owner/imd",
      "/owner/marketplace",
      "/owner/imd/ad-spaces",
      "/owner/imd/ad-spaces/new",
      "/owner/imd/clients",
      "/owner/imd/clients/new",
      "/owner/imd/bookings",
      "/owner/imd/bookings/new",
      "/owner/imd/calendar",
      "/owner/imd/invoices",
    ],
  },
  {
    name: "admin",
    email: "admin@tabellone.com",
    password: "admin1234",
    paths: [
      "/admin/dashboard",
      "/admin/listings",
      "/admin/booking-requests",
      "/admin/pricing",
      "/admin/owners",
      "/admin/advertisers",
      "/admin/users",
    ],
  },
  {
    name: "advertiser",
    email: "advertiser@demo.tabellone.com",
    password: "demo1234",
    paths: [
      "/advertiser/dashboard",
      "/advertiser/campaigns",
      "/advertiser/wishlist",
      "/advertiser/cart",
      "/advertiser/booking-requests",
      "/advertiser/subscription",
      "/advertiser/wallet",
    ],
  },
];

const publicPaths = [
  "/",
  "/login",
  "/register/owner",
  "/register/advertiser",
  "/organizations/new",
  "/marketplace",
];

function parseCookies(setCookie) {
  if (!setCookie) return "";
  const list = Array.isArray(setCookie) ? setCookie : [setCookie];
  return list.map((c) => c.split(";")[0]).join("; ");
}

async function login(email, password) {
  const res = await fetch(`${BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const raw = res.headers.getSetCookie?.() ?? [];
  const cookie = parseCookies(raw.length ? raw : res.headers.get("set-cookie"));
  const body = await res.json().catch(() => ({}));
  return { status: res.status, cookie, body };
}

async function get(path, cookie) {
  const res = await fetch(`${BASE}${path}`, {
    redirect: "manual",
    headers: cookie ? { Cookie: cookie } : {},
  });
  const text = await res.text();
  const hasError =
    /Application error|Internal Server Error|Unhandled Runtime Error/i.test(text);
  return { status: res.status, hasError };
}

async function main() {
  const failures = [];

  for (const path of publicPaths) {
    const r = await get(path);
    const ok = (r.status === 200 || r.status === 307) && !r.hasError;
    console.log(`${ok ? "OK" : "FAIL"} public ${path} -> ${r.status}${r.hasError ? " (error page)" : ""}`);
    if (!ok) failures.push({ role: "public", path, ...r });
  }

  for (const role of roles) {
    const auth = await login(role.email, role.password);
    if (auth.status !== 200 || !auth.cookie) {
      console.log(`FAIL login ${role.name} -> ${auth.status}`);
      failures.push({ role: role.name, path: "login", status: auth.status });
      continue;
    }
    console.log(`OK login ${role.name}`);
    for (const path of role.paths) {
      const r = await get(path, auth.cookie);
      const ok =
        (r.status === 200 || r.status === 307 || r.status === 308) && !r.hasError;
      console.log(
        `${ok ? "OK" : "FAIL"} ${role.name} ${path} -> ${r.status}${r.hasError ? " (error page)" : ""}`
      );
      if (!ok) failures.push({ role: role.name, path, ...r });
    }
    await fetch(`${BASE}/api/v1/auth/logout`, {
      method: "POST",
      headers: { Cookie: auth.cookie },
    }).catch(() => {});
  }

  const apis = [
    { role: "owner", email: "owner@demo.tabellone.com", path: "/api/v1/imd/ad-spaces" },
    { role: "advertiser", email: "advertiser@demo.tabellone.com", path: "/api/v1/advertiser/cart" },
    { role: "admin", email: "admin@tabellone.com", path: "/api/v1/admin/listings" },
  ];
  for (const api of apis) {
    const pwd = api.role === "admin" ? "admin1234" : "demo1234";
    const a = await login(api.email, pwd);
    const res = await fetch(`${BASE}${api.path}`, {
      headers: { Cookie: a.cookie },
    });
    const ok = res.status === 200;
    console.log(`${ok ? "OK" : "FAIL"} API ${api.path} -> ${res.status}`);
    if (!ok) failures.push({ role: api.role, path: api.path, status: res.status });
  }

  console.log(`\nTotal failures: ${failures.length}`);
  if (failures.length) {
    console.log(JSON.stringify(failures, null, 2));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
