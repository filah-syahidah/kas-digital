import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
    getAuth,
    signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { db } from "./firebase-init.js";

const listData = document.getElementById("listData");
const totalKasEl = document.getElementById("totalKas");
const totalMasukEl = document.getElementById("totalMasuk");
const totalKeluarEl = document.getElementById("totalKeluar");
const financialAlertEl = document.getElementById("financialAlert");
const healthFillEl = document.getElementById("healthFill");
const healthPercentEl = document.getElementById("healthPercent");
const healthTrackEl = document.getElementById("healthTrack");
const healthInfoEl = document.getElementById("healthInfo");
const rulesPublicBody = document.getElementById("rulesPublicBody");
const monthlyChecklistBody = document.getElementById("monthlyChecklistBody");
const monthlySummaryPublic = document.getElementById("monthlySummaryPublic");

const rupiah = (value) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
const MIN_SAFE_BALANCE = 50000;
const IDEAL_BALANCE = 200000;
const auth = getAuth();
const MONTHLY_COLLECTION = "kasBulanan";

const formatMonthLabel = (monthValue) => {
    if (!monthValue) {
        return "-";
    }

    const parsed = new Date(`${monthValue}-01T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
        return monthValue;
    }

    return parsed.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
};

async function loadSettings() {
    try {
        const settingsDoc = await getDoc(doc(db, "kasRules", "default"));
        if (settingsDoc.exists()) {
            const data = settingsDoc.data();
            const rules = Array.isArray(data.rules) ? data.rules : [];
            renderRulesPublic(rules);
        } else {
            renderRulesPublic([]);
        }
    } catch (error) {
        console.error("Gagal load settings:", error);
        renderRulesPublic([]);
    }
}

function renderRulesPublic(rules) {
    if (!rulesPublicBody) {
        return;
    }

    if (!rules || rules.length === 0) {
        rulesPublicBody.innerHTML = '<div class="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-500">Belum ada peraturan kas.</div>';
        return;
    }

    rulesPublicBody.innerHTML = rules.map((rule) => `
        <article class="rounded-xl border border-amber-300 bg-amber-50/80 p-4 shadow-sm">
            <h4 class="mt-1 text-lg font-extrabold text-slate-900">${rupiah(rule.jumlah || 0)}</h4>
            <p class="mt-1 text-xs font-bold uppercase tracking-wide text-slate-600">Periode: ${rule.periode || "-"}</p>
            <p class="mt-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">${rule.keterangan || "-"}</p>
        </article>
    `).join("");
}

function renderMonthlySummary(items) {
    if (!monthlySummaryPublic) {
        return;
    }

    monthlySummaryPublic.className = "mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4";

    const total = items.length;
    const paidCount = items.filter((item) => item.statusBayar).length;
    const paidAmount = items
        .filter((item) => item.statusBayar)
        .reduce((sum, item) => sum + Number(item.jumlah || 0), 0);
    const unpaidCount = total - paidCount;

    monthlySummaryPublic.innerHTML = `
        <article class="rounded-lg border border-slate-200 bg-white p-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Data</p>
            <strong class="mt-1 block text-xl font-extrabold text-slate-900">${total}</strong>
        </article>
        <article class="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-emerald-700">Sudah Bayar</p>
            <strong class="mt-1 block text-xl font-extrabold text-emerald-700">${paidCount}</strong>
        </article>
        <article class="rounded-lg border ${unpaidCount > 0 ? "border-amber-200 bg-amber-50" : "border-brand-200 bg-brand-50"} p-3">
            <p class="text-xs font-semibold uppercase tracking-wide ${unpaidCount > 0 ? "text-amber-700" : "text-brand-700"}">Belum Bayar</p>
            <strong class="mt-1 block text-xl font-extrabold ${unpaidCount > 0 ? "text-amber-700" : "text-brand-700"}">${unpaidCount}</strong>
        </article>
        <article class="rounded-lg border ${paidAmount > 0 ? "border-brand-200 bg-brand-50" : "border-slate-200 bg-white"} p-3">
            <p class="text-xs font-semibold uppercase tracking-wide ${paidAmount > 0 ? "text-brand-700" : "text-slate-500"}">Total Uang Sudah Bayar</p>
            <strong class="mt-1 block text-xl font-extrabold ${paidAmount > 0 ? "text-brand-700" : "text-slate-700"}">${rupiah(paidAmount)}</strong>
        </article>
    `;
}

function renderMonthlyChecklist(items) {
    if (!monthlyChecklistBody) {
        return;
    }

    renderMonthlySummary(items);

    if (!items.length) {
        monthlyChecklistBody.innerHTML = '<tr><td colspan="5" class="px-4 py-3 text-sm text-slate-500">Belum ada checklist kas bulanan.</td></tr>';
        return;
    }

    monthlyChecklistBody.innerHTML = items.map((item) => `
        <tr class="hover:bg-slate-50/80">
            <td class="px-4 py-3 text-slate-700">${formatMonthLabel(item.bulan)}</td>
            <td class="px-4 py-3 font-semibold text-slate-800">${item.namaSiswa || "-"}</td>
            <td class="px-4 py-3 font-semibold text-brand-700">${rupiah(item.jumlah || 0)}</td>
            <td class="px-4 py-3">
                <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${item.statusBayar ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}">
                    ${item.statusBayar ? "Lunas" : "Belum"}
                </span>
            </td>
            <td class="px-4 py-3 text-slate-600">${item.keterangan || "-"}</td>
        </tr>
    `).join("");
}

function updateHealthMeter(totalKas) {
    if (!healthFillEl || !healthPercentEl || !healthTrackEl || !healthInfoEl) {
        return;
    }

    const rawPercent = (totalKas / IDEAL_BALANCE) * 100;
    const percent = Math.max(0, Math.min(100, Math.round(rawPercent)));

    healthFillEl.style.width = `${percent}%`;
    healthTrackEl.setAttribute("aria-valuenow", String(percent));
    healthPercentEl.textContent = `${percent}%`;
    healthFillEl.classList.remove("from-rose-500", "to-rose-700", "from-amber-500", "to-amber-600", "from-emerald-500", "to-emerald-700", "from-brand-600", "to-accent-500");

    if (totalKas < 0) {
        healthFillEl.classList.add("from-rose-500", "to-rose-700");
        healthInfoEl.textContent = `Kondisi kritis: kas minus ${rupiah(Math.abs(totalKas))}.`;
        return;
    }

    if (totalKas <= MIN_SAFE_BALANCE) {
        healthFillEl.classList.add("from-amber-500", "to-amber-600");
        healthInfoEl.textContent = "Kondisi waspada: saldo kas menipis.";
        return;
    }

    healthFillEl.classList.add("from-emerald-500", "to-emerald-700");
    healthInfoEl.textContent = "Kondisi sehat: saldo kas cukup untuk operasional.";
}

function updateFinancialAlert(totalKas) {
    if (!financialAlertEl) {
        return;
    }

    financialAlertEl.classList.remove("hidden", "border-emerald-200", "bg-emerald-50", "text-emerald-700", "border-amber-200", "bg-amber-50", "text-amber-700", "border-rose-200", "bg-rose-50", "text-rose-700");

    if (totalKas < 0) {
        financialAlertEl.classList.add("border-rose-200", "bg-rose-50", "text-rose-700");
        financialAlertEl.textContent = "Peringatan: kas minus. Segera tambahkan pemasukan agar saldo kembali aman.";
        return;
    }

    if (totalKas <= MIN_SAFE_BALANCE) {
        financialAlertEl.classList.add("border-amber-200", "bg-amber-50", "text-amber-700");
        financialAlertEl.textContent = "Dana menipis. Prioritaskan pemasukan dan tunda pengeluaran non-prioritas.";
        return;
    }

    financialAlertEl.classList.add("border-emerald-200", "bg-emerald-50", "text-emerald-700");
    financialAlertEl.textContent = "Saldo kas dalam kondisi aman.";
}

function render(items) {
    if (!items.length) {
        listData.innerHTML = '<li class="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-500">Belum ada transaksi.</li>';
        totalKasEl.textContent = rupiah(0);
        totalMasukEl.textContent = rupiah(0);
        totalKeluarEl.textContent = rupiah(0);
        updateFinancialAlert(0);
        updateHealthMeter(0);
        return;
    }

    let totalKas = 0;
    let totalMasuk = 0;
    let totalKeluar = 0;

    const rows = items.map((item) => {
        const jenis = item.jenis === "keluar" ? "keluar" : "masuk";
        const jumlah = Number(item.jumlah || 0);

        if (jenis === "masuk") {
            totalKas += jumlah;
            totalMasuk += jumlah;
        } else {
            totalKas -= jumlah;
            totalKeluar += jumlah;
        }

        return `
            <li class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div class="mb-2 flex items-center justify-between gap-2">
                    <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${jenis === "masuk" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}">${jenis}</span>
                    <small class="text-xs font-semibold text-slate-500">${item.tanggal || "-"}</small>
                </div>
                <strong class="block text-sm text-slate-800">${item.keterangan || "Tanpa keterangan"}</strong>
                <p class="mt-1 text-base font-extrabold ${jenis === "masuk" ? "text-emerald-600" : "text-rose-600"}">
                    ${jenis === "masuk" ? "+" : "-"} ${rupiah(jumlah)}
                </p>
            </li>
        `;
    });

    listData.innerHTML = rows.join("");
    totalKasEl.textContent = rupiah(totalKas);
    totalMasukEl.textContent = rupiah(totalMasuk);
    totalKeluarEl.textContent = rupiah(totalKeluar);
    updateFinancialAlert(totalKas);
    updateHealthMeter(totalKas);
}

async function startApp() {
    await loadSettings();

    const kasQuery = query(collection(db, "kas"), orderBy("tanggal", "desc"));
    onSnapshot(
        kasQuery,
        (snapshot) => {
            const data = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
            render(data);
        },
        (error) => {
            console.error("Gagal memuat transaksi:", error);
            listData.innerHTML = '<li class="rounded-xl border border-dashed border-rose-300 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">Transaksi belum dapat dimuat. Periksa izin Firestore.</li>';
        }
    );

    const monthlyQuery = query(collection(db, MONTHLY_COLLECTION), orderBy("bulan", "desc"));
    onSnapshot(
        monthlyQuery,
        (snapshot) => {
            const data = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
            renderMonthlyChecklist(data);
        },
        (error) => {
            console.error("Gagal memuat checklist bulanan:", error);
            if (monthlyChecklistBody) {
                monthlyChecklistBody.innerHTML = '<tr><td colspan="5" class="px-4 py-3 text-sm text-rose-700">Checklist belum dapat dimuat. Periksa izin Firestore.</td></tr>';
            }
        }
    );
}

startApp();

signInAnonymously(auth).catch((error) => {
    // Public page should still work when Firestore allows direct reads.
    console.warn("Login anonim tidak aktif atau gagal:", error);
});
