export const REVALIDATE = 86400;

async function withTimeout(url: string, ms = 5000): Promise<Response> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    return await fetch(url, { signal: ctl.signal, next: { revalidate: REVALIDATE } });
  } finally {
    clearTimeout(t);
  }
}

export async function fetchWorldBank(code: string, indicators: string[]) {
  try {
    const out: Record<string, number | null> = {};
    for (const ind of indicators.slice(0, 5)) {
      const res = await withTimeout(`https://api.worldbank.org/v2/country/${code}/indicator/${ind}?format=json&per_page=2`);
      const j = await res.json();
      const val = Array.isArray(j) && j[1]?.[0]?.value != null ? Number(j[1][0].value) : null;
      out[ind] = val;
    }
    return { ok: true, data: out, updatedAt: new Date().toISOString() };
  } catch {
    return { ok: false, data: {} as Record<string, number | null>, updatedAt: new Date().toISOString() };
  }
}

export async function fetchFx() {
  try {
    const res = await withTimeout("https://api.frankfurter.app/latest?from=USD");
    const j = await res.json();
    return { ok: true, data: j.rates as Record<string, number>, updatedAt: j.date as string };
  } catch {
    return { ok: false, data: {} as Record<string, number>, updatedAt: "" };
  }
}

export async function fetchGdelt(query: string) {
  try {
    const res = await withTimeout(
      `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist&maxrecords=5&format=json`
    );
    const j = await res.json();
    const items = (j.articles ?? []).map((a: { title: string; url: string; domain: string; seendate: string }) => ({
      title: a.title, url: a.url, domain: a.domain, seendate: a.seendate,
    }));
    return { ok: true, data: items, updatedAt: new Date().toISOString() };
  } catch {
    return { ok: false, data: [] as { title: string; url: string; domain: string; seendate: string }[], updatedAt: "" };
  }
}

export async function fetchBasics(code: string) {
  try {
    const res = await withTimeout(`https://countries.dev/alpha/${code}`);
    const j = await res.json();
    return { ok: true, data: j, updatedAt: new Date().toISOString() };
  } catch {
    return { ok: false, data: null, updatedAt: "" };
  }
}
