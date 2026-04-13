import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    setDoc,
    updateDoc,
    where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { auth, db } from "./firebase-init.js";

const kasForm = document.getElementById("kasForm");
const editIdEl = document.getElementById("editId");
const jenisEl = document.getElementById("jenis");
const jumlahEl = document.getElementById("jumlah");
const keteranganEl = document.getElementById("keterangan");
const btnSubmit = document.getElementById("btnSubmit");
const btnCancel = document.getElementById("btnCancel");
const btnLogout = document.getElementById("btnLogout");
const tableBody = document.getElementById("tableBody");
const totalKasEl = document.getElementById("totalKas");
const totalMasukEl = document.getElementById("totalMasuk");
const totalKeluarEl = document.getElementById("totalKeluar");
const financialAlertEl = document.getElementById("financialAlert");
const healthFillEl = document.getElementById("healthFill");
const healthPercentEl = document.getElementById("healthPercent");
const healthTrackEl = document.getElementById("healthTrack");
const healthInfoEl = document.getElementById("healthInfo");
const chips = Array.from(document.querySelectorAll(".chip[data-filter]"));
const searchInput = document.getElementById("searchInput");
const confirmModal = document.getElementById("confirmModal");
const btnModalCancel = document.getElementById("btnModalCancel");
const btnModalDelete = document.getElementById("btnModalDelete");
const settingsModal = document.getElementById("settingsModal");
const rulesForm = document.getElementById("rulesForm");
const btnSettings = document.getElementById("btnSettings");
const btnSettingsMenu = document.getElementById("btnSettingsMenu");
const btnSettingsCancel = document.getElementById("btnSettingsCancel");
const rulesJumlahInput = document.getElementById("rulesJumlah");
const rulesPeriodeSelect = document.getElementById("rulesPeriode");
const rulesKeteranganInput = document.getElementById("rulesKeterangan");
const rulesSubmitBtn = document.getElementById("rulesSubmitBtn");
const rulesResetBtn = document.getElementById("rulesResetBtn");
const toastArea = document.getElementById("toastArea");
const monthlyForm = document.getElementById("monthlyForm");
const monthlyEditIdEl = document.getElementById("monthlyEditId");
const monthlyNamaSiswaEl = document.getElementById("monthlyNamaSiswa");
const monthlyBulanEl = document.getElementById("monthlyBulan");
const monthlyJumlahEl = document.getElementById("monthlyJumlah");
const monthlyStatusEl = document.getElementById("monthlyStatus");
const monthlyKeteranganEl = document.getElementById("monthlyKeterangan");
const monthlySubmitBtn = document.getElementById("monthlySubmitBtn");
const monthlyResetBtn = document.getElementById("monthlyResetBtn");
const monthlyResetMonthBtn = document.getElementById("monthlyResetMonthBtn");
const monthlyCancelBtn = document.getElementById("monthlyCancelBtn");
const monthlyTableBody = document.getElementById("monthlyTableBody");
const monthlySummaryEl = document.getElementById("monthlySummary");
const dashboardGrandTotalEl = document.getElementById("dashboardGrandTotal");
const dashboardPaidCountEl = document.getElementById("dashboardPaidCount");
const dashboardUnpaidCountEl = document.getElementById("dashboardUnpaidCount");
const dashboardPaidAmountEl = document.getElementById("dashboardPaidAmount");
const dashboardMonthlyBody = document.getElementById("dashboardMonthlyBody");

const docsCache = new Map();
let allItems = [];
let activeFilter = "all";
let deleteTargetId = "";
let rules = [];
let editingRuleId = null;
let monthlyItems = [];
let editingMonthlyId = null;
const rupiah = (value) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
const tanggalHariIni = () => new Date().toISOString().slice(0, 10);
const currentMonthValue = () => new Date().toISOString().slice(0, 7);
const MIN_SAFE_BALANCE = 50000;
const IDEAL_BALANCE = 200000;
const MONTHLY_COLLECTION = "kasBulanan";

function formatMonthLabel(monthValue) {
    if (!monthValue) {
        return "-";
    }

    const parsed = new Date(`${monthValue}-01T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
        return monthValue;
    }

    return parsed.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

function renderDashboardDetails(items) {
    const hasDashboardWidgets = dashboardGrandTotalEl
        && dashboardPaidCountEl
        && dashboardUnpaidCountEl
        && dashboardPaidAmountEl
        && dashboardMonthlyBody;

    if (!hasDashboardWidgets) {
        return;
    }

    const totalData = items.length;
    const paidCount = items.filter((item) => item.statusBayar).length;
    const unpaidCount = totalData - paidCount;
    const paidAmount = items
        .filter((item) => item.statusBayar)
        .reduce((sum, item) => sum + Number(item.jumlah || 0), 0);

    dashboardGrandTotalEl.textContent = String(totalData);
    dashboardPaidCountEl.textContent = String(paidCount);
    dashboardUnpaidCountEl.textContent = String(unpaidCount);
    dashboardPaidAmountEl.textContent = rupiah(paidAmount);

    if (!items.length) {
        dashboardMonthlyBody.innerHTML = '<tr><td colspan="5" class="px-4 py-3 text-sm text-slate-500">Belum ada data checklist bulanan.</td></tr>';
        return;
    }

    const monthMap = new Map();
    for (const item of items) {
        const bulan = item.bulan || "-";
        if (!monthMap.has(bulan)) {
            monthMap.set(bulan, {
                month: bulan,
                total: 0,
                paid: 0,
                unpaid: 0,
                paidAmountByMonth: 0
            });
        }

        const bucket = monthMap.get(bulan);
        bucket.total += 1;
        if (item.statusBayar) {
            bucket.paid += 1;
            bucket.paidAmountByMonth += Number(item.jumlah || 0);
        } else {
            bucket.unpaid += 1;
        }
    }

    const monthRows = Array.from(monthMap.values())
        .sort((a, b) => b.month.localeCompare(a.month))
        .map((row) => `
            <tr class="hover:bg-slate-50/80">
                <td class="px-4 py-3 text-slate-700">${formatMonthLabel(row.month)}</td>
                <td class="px-4 py-3 font-semibold text-slate-800">${row.total}</td>
                <td class="px-4 py-3 font-semibold text-emerald-700">${row.paid}</td>
                <td class="px-4 py-3 font-semibold text-amber-700">${row.unpaid}</td>
                <td class="px-4 py-3 font-semibold text-brand-700">${rupiah(row.paidAmountByMonth)}</td>
            </tr>
        `)
        .join("");

    dashboardMonthlyBody.innerHTML = monthRows;
}

async function loadSettings() {
    try {
        const settingsDoc = await getDoc(doc(db, "kasRules", "default"));
        if (settingsDoc.exists()) {
            const data = settingsDoc.data();
            rules = Array.isArray(data.rules) ? data.rules : [];
        } else {
            rules = [];
        }
        renderRulesTable();
    } catch (error) {
        console.error("Gagal load settings:", error);
        showToast("Gagal memuat peraturan kas.", "error");
    }
}

async function saveNewRule() {
    const jumlah = rulesJumlahInput.value.trim();
    const periode = rulesPeriodeSelect.value;
    const keterangan = rulesKeteranganInput.value.trim();

    if (!jumlah || !periode || !keterangan) {
        showToast("Semua field harus diisi.", "warn");
        return;
    }

    const jumlahNum = Number(jumlah);
    if (jumlahNum <= 0) {
        showToast("Jumlah harus lebih dari 0.", "warn");
        return;
    }

    try {
        const newRule = {
            id: editingRuleId || Date.now(),
            jumlah: jumlahNum,
            periode,
            keterangan
        };

        if (editingRuleId) {
            const idx = rules.findIndex((item) => item.id === editingRuleId);
            if (idx >= 0) {
                rules[idx] = newRule;
            }
            editingRuleId = null;
        } else {
            rules.push(newRule);
        }

        await setDoc(doc(db, "kasRules", "default"), { rules }, { merge: true });
        showToast("Peraturan berhasil disimpan.", "success");
        resetRuleForm();
        renderRulesTable();
    } catch (error) {
        console.error("Gagal simpan rule:", error);
        showToast("Gagal menyimpan peraturan.", "error");
    }
}

function renderRulesTable() {
    const rulesList = document.getElementById("rulesTableList");
    if (!rulesList) {
        return;
    }

    if (!rules.length) {
        rulesList.innerHTML = '<div class="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-500">Belum ada peraturan kas.</div>';
        return;
    }

    rulesList.innerHTML = rules.map((rule) => `
        <article class="rounded-xl border border-amber-300 bg-amber-50/80 p-4 shadow-sm">
            <div class="flex items-start justify-between gap-3">
                <div>
                    <h5 class="mt-1 text-lg font-extrabold text-slate-900">${rupiah(rule.jumlah)}</h5>
                    <p class="mt-1 text-xs font-bold uppercase tracking-wide text-slate-600">Periode: ${rule.periode}</p>
                    <p class="mt-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">${rule.keterangan}</p>
                </div>
                <div class="flex shrink-0 flex-wrap gap-2">
                    <button type="button" class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700" data-edit-rule="${rule.id}">Edit</button>
                    <button type="button" class="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white" data-delete-rule="${rule.id}">Hapus</button>
                </div>
            </div>
        </article>
    `).join("");
}

function editRule(id) {
    const rule = rules.find((item) => item.id === id);
    if (!rule) {
        return;
    }

    editingRuleId = id;
    rulesJumlahInput.value = rule.jumlah;
    rulesPeriodeSelect.value = rule.periode;
    rulesKeteranganInput.value = rule.keterangan;
    rulesSubmitBtn.textContent = "Update Peraturan";
}

function resetRuleForm() {
    rulesJumlahInput.value = "";
    rulesPeriodeSelect.value = "minggu";
    rulesKeteranganInput.value = "";
    editingRuleId = null;
    rulesSubmitBtn.textContent = "Tambah Peraturan";
}

async function deleteRule(id) {
    try {
        rules = rules.filter((item) => item.id !== id);
        await setDoc(doc(db, "kasRules", "default"), { rules }, { merge: true });
        showToast("Peraturan berhasil dihapus.", "success");
        renderRulesTable();
    } catch (error) {
        console.error("Gagal hapus rule:", error);
        showToast("Gagal menghapus peraturan.", "error");
    }
}

function resetMonthlyForm() {
    if (!monthlyForm) {
        return;
    }

    monthlyEditIdEl.value = "";
    monthlyForm.reset();
    monthlyBulanEl.value = currentMonthValue();
    monthlyStatusEl.checked = false;
    monthlySubmitBtn.textContent = "Simpan Checklist";
    monthlyCancelBtn.classList.add("hidden");
    editingMonthlyId = null;
}

function renderMonthlySummary(items) {
    if (!monthlySummaryEl) {
        return;
    }

    monthlySummaryEl.className = "mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4";

    const total = items.length;
    const paidCount = items.filter((item) => item.statusBayar).length;
    const paidAmount = items
        .filter((item) => item.statusBayar)
        .reduce((sum, item) => sum + Number(item.jumlah || 0), 0);
    const unpaidCount = total - paidCount;

    monthlySummaryEl.innerHTML = `
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
    if (!monthlyTableBody) {
        return;
    }

    renderMonthlySummary(items);

    if (!items.length) {
        monthlyTableBody.innerHTML = '<tr><td colspan="6" class="px-4 py-3 text-sm text-slate-500">Belum ada checklist kas bulanan.</td></tr>';
        return;
    }

    monthlyTableBody.innerHTML = items.map((item) => `
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
            <td class="px-4 py-3">
                <div class="flex flex-wrap gap-2">
                    <button type="button" class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700" data-edit-monthly="${item.id}">Edit</button>
                    <button type="button" class="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white" data-delete-monthly="${item.id}">Hapus</button>
                </div>
            </td>
        </tr>
    `).join("");
}

function editMonthly(id) {
    const item = monthlyItems.find((entry) => entry.id === id);
    if (!item) {
        return;
    }

    editingMonthlyId = id;
    monthlyEditIdEl.value = id;
    monthlyNamaSiswaEl.value = item.namaSiswa || "";
    monthlyBulanEl.value = item.bulan || currentMonthValue();
    monthlyJumlahEl.value = Number(item.jumlah || 0);
    monthlyStatusEl.checked = Boolean(item.statusBayar);
    monthlyKeteranganEl.value = item.keterangan || "";
    monthlySubmitBtn.textContent = "Update Checklist";
    monthlyCancelBtn.classList.remove("hidden");
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}

async function saveMonthlyChecklist() {
    const namaSiswa = monthlyNamaSiswaEl.value.trim();
    const bulan = monthlyBulanEl.value;
    const jumlah = Number(monthlyJumlahEl.value || 0);
    const statusBayar = monthlyStatusEl.checked;
    const keterangan = monthlyKeteranganEl.value.trim();

    if (!namaSiswa || !bulan || !jumlah) {
        showToast("Nama siswa, bulan, dan nominal wajib diisi.", "warn");
        return;
    }

    try {
        const monthlyRef = editingMonthlyId
            ? doc(db, MONTHLY_COLLECTION, editingMonthlyId)
            : doc(collection(db, MONTHLY_COLLECTION));

        const monthlyId = monthlyRef.id;
        const payload = {
            namaSiswa,
            bulan,
            jumlah,
            statusBayar,
            keterangan,
            updatedAt: new Date().toISOString(),
            transactionId: `monthly-${monthlyId}`
        };

        if (editingMonthlyId) {
            await setDoc(monthlyRef, payload, { merge: true });
            showToast("Checklist bulanan berhasil diupdate.", "success");
        } else {
            await setDoc(monthlyRef, {
                ...payload,
                createdAt: new Date().toISOString()
            });
            showToast("Checklist bulanan berhasil disimpan.", "success");
        }

        const transactionRef = doc(db, "kas", `monthly-${monthlyId}`);
        if (statusBayar) {
            await setDoc(transactionRef, {
                jenis: "masuk",
                jumlah,
                keterangan: keterangan || `Pembayaran kas ${namaSiswa} ${formatMonthLabel(bulan)}`,
                tanggal: `${bulan}-01`,
                sourceType: "monthly",
                sourceId: monthlyId,
                namaSiswa,
                bulan,
                statusBayar: true,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        } else {
            await deleteDoc(transactionRef).catch(() => {});
        }

        resetMonthlyForm();
    } catch (error) {
        console.error("Gagal simpan checklist bulanan:", error);
        showToast("Gagal menyimpan checklist bulanan.", "error");
    }
}

async function deleteMonthlyChecklist(id) {
    try {
        await deleteDoc(doc(db, "kas", `monthly-${id}`)).catch(() => {});
        await deleteDoc(doc(db, MONTHLY_COLLECTION, id));
        if (editingMonthlyId === id) {
            resetMonthlyForm();
        }
        showToast("Checklist bulanan berhasil dihapus.", "success");
    } catch (error) {
        console.error("Gagal hapus checklist bulanan:", error);
        showToast("Gagal menghapus checklist bulanan.", "error");
    }
}

async function resetMonthlyByMonth() {
    const bulan = monthlyBulanEl?.value || currentMonthValue();
    const monthLabel = formatMonthLabel(bulan);

    if (!bulan) {
        showToast("Pilih bulan terlebih dahulu.", "warn");
        return;
    }

    const confirmed = confirm(`Reset semua checklist bulan ${monthLabel}? Data yang dihapus tidak bisa dikembalikan.`);
    if (!confirmed) {
        return;
    }

    const secondConfirm = prompt(`Ketik RESET untuk konfirmasi reset bulan ${monthLabel}.`);
    if (secondConfirm !== "RESET") {
        showToast("Reset bulan dibatalkan.", "warn");
        return;
    }

    try {
        const monthQuery = query(collection(db, MONTHLY_COLLECTION), where("bulan", "==", bulan));
        const snapshot = await getDocs(monthQuery);

        if (snapshot.empty) {
            showToast(`Tidak ada data checklist untuk ${monthLabel}.`, "warn");
            return;
        }

        let deletedChecklist = 0;
        let deletedTransactions = 0;

        for (const itemDoc of snapshot.docs) {
            const data = itemDoc.data();
            const transactionId = data.transactionId || `monthly-${itemDoc.id}`;

            await deleteDoc(doc(db, MONTHLY_COLLECTION, itemDoc.id));
            deletedChecklist += 1;

            try {
                await deleteDoc(doc(db, "kas", transactionId));
                deletedTransactions += 1;
            } catch (_error) {
                // Ignore missing transaction docs during month reset.
            }
        }

        resetMonthlyForm();
        showToast(`Reset ${monthLabel} selesai. ${deletedChecklist} checklist dan ${deletedTransactions} transaksi dihapus.`, "success");
    } catch (error) {
        console.error("Gagal reset checklist bulanan:", error);
        showToast("Gagal melakukan reset bulan.", "error");
    }
}

function openSettingsModal() {
    settingsModal.classList.remove("hidden");
    renderRulesTable();
}

function closeSettingsModal() {
    settingsModal.classList.add("hidden");
    resetRuleForm();
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
        financialAlertEl.textContent = "Peringatan: kas minus. Segera evaluasi pengeluaran dan tambah pemasukan.";
        return;
    }

    if (totalKas <= MIN_SAFE_BALANCE) {
        financialAlertEl.classList.add("border-amber-200", "bg-amber-50", "text-amber-700");
        financialAlertEl.textContent = "Dana menipis. Sebaiknya batasi pengeluaran sementara.";
        return;
    }

    financialAlertEl.classList.add("border-emerald-200", "bg-emerald-50", "text-emerald-700");
    financialAlertEl.textContent = "Saldo kas aman dan terkendali.";
}

function showToast(message, type = "info") {
    const toast = document.createElement("div");
    const typeClass = {
        success: "border-emerald-200 bg-emerald-50 text-emerald-700",
        error: "border-rose-200 bg-rose-50 text-rose-700",
        warn: "border-amber-200 bg-amber-50 text-amber-700",
        info: "border-slate-200 bg-white text-slate-700"
    };
    toast.className = `translate-y-2 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg opacity-0 transition-all duration-200 ${typeClass[type] || typeClass.info}`;
    toast.textContent = message;
    toastArea.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.remove("translate-y-2", "opacity-0");
        toast.classList.add("translate-y-0", "opacity-100");
    });

    setTimeout(() => {
        toast.classList.remove("translate-y-0", "opacity-100");
        toast.classList.add("translate-y-2", "opacity-0");
        setTimeout(() => toast.remove(), 220);
    }, 2300);
}

function updateChipsState() {
    chips.forEach((chip) => {
        const isActive = chip.getAttribute("data-filter") === activeFilter;
        chip.classList.toggle("bg-brand-600", isActive);
        chip.classList.toggle("text-white", isActive);
        chip.classList.toggle("border-brand-600", isActive);
        chip.classList.toggle("bg-white", !isActive);
        chip.classList.toggle("text-slate-600", !isActive);
        chip.classList.toggle("border-slate-200", !isActive);
    });
}

function getFilteredItems() {
    const keyword = searchInput.value.trim().toLowerCase();

    return allItems.filter((item) => {
        const jenis = item.jenis === "keluar" ? "keluar" : "masuk";
        const passFilter = activeFilter === "all" || jenis === activeFilter;
        if (!passFilter) {
            return false;
        }

        if (!keyword) {
            return true;
        }

        const keterangan = String(item.keterangan || "").toLowerCase();
        const tanggal = String(item.tanggal || "").toLowerCase();
        const jumlah = String(item.jumlah || "").toLowerCase();
        return keterangan.includes(keyword) || tanggal.includes(keyword) || jumlah.includes(keyword);
    });
}

function renderCurrentView() {
    renderTable(getFilteredItems());
}

function openDeleteModal(id) {
    deleteTargetId = id;
    confirmModal.classList.remove("hidden");
}

function closeDeleteModal() {
    deleteTargetId = "";
    confirmModal.classList.add("hidden");
}

function resetForm() {
    editIdEl.value = "";
    kasForm.reset();
    jenisEl.value = "masuk";
    btnSubmit.textContent = "Simpan";
    btnCancel.classList.add("hidden");
}

function setEditMode(id) {
    const data = docsCache.get(id);
    if (!data) {
        return;
    }

    editIdEl.value = id;
    jenisEl.value = data.jenis || "masuk";
    jumlahEl.value = Number(data.jumlah || 0);
    keteranganEl.value = data.keterangan || "";
    btnSubmit.textContent = "Update";
    btnCancel.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderTable(items) {
    docsCache.clear();

    let totalKas = 0;
    let totalMasuk = 0;
    let totalKeluar = 0;

    allItems.forEach((item) => {
        const jenis = item.jenis === "keluar" ? "keluar" : "masuk";
        const jumlah = Number(item.jumlah || 0);

        if (jenis === "masuk") {
            totalKas += jumlah;
            totalMasuk += jumlah;
        } else {
            totalKas -= jumlah;
            totalKeluar += jumlah;
        }
    });

    totalKasEl.textContent = rupiah(totalKas);
    totalMasukEl.textContent = rupiah(totalMasuk);
    totalKeluarEl.textContent = rupiah(totalKeluar);
    updateFinancialAlert(totalKas);
    updateHealthMeter(totalKas);

    if (!items.length) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-4 py-3 text-sm text-slate-500">Belum ada transaksi.</td>
            </tr>
        `;
        return;
    }

    const rows = items.map((item) => {
        docsCache.set(item.id, item);

        const jenis = item.jenis === "keluar" ? "keluar" : "masuk";
        const jumlah = Number(item.jumlah || 0);

        return `
            <tr class="hover:bg-slate-50/80">
                <td class="px-4 py-3 text-slate-700">${item.tanggal || "-"}</td>
                <td class="px-4 py-3">
                    <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${jenis === "masuk" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}">${jenis}</span>
                </td>
                <td class="px-4 py-3 text-slate-700">${item.keterangan || "Tanpa keterangan"}</td>
                <td class="px-4 py-3 font-semibold ${jenis === "masuk" ? "text-emerald-600" : "text-rose-600"}">
                    ${jenis === "masuk" ? "+" : "-"} ${rupiah(jumlah)}
                </td>
                <td class="px-4 py-3">
                    <div class="flex flex-wrap gap-2">
                        <button type="button" class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700" data-edit="${item.id}">Edit</button>
                        <button type="button" class="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white" data-delete="${item.id}">Hapus</button>
                    </div>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = rows.join("");
}

kasForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const id = editIdEl.value;
    const payload = {
        jenis: jenisEl.value,
        jumlah: Number(jumlahEl.value || 0),
        keterangan: keteranganEl.value.trim(),
        tanggal: tanggalHariIni()
    };

    if (!payload.jumlah || !payload.keterangan) {
        showToast("Jumlah dan keterangan wajib diisi.", "warn");
        return;
    }

    try {
        if (id) {
            await updateDoc(doc(db, "kas", id), payload);
            showToast("Transaksi berhasil diupdate.", "success");
        } else {
            await addDoc(collection(db, "kas"), payload);
            showToast("Transaksi berhasil ditambahkan.", "success");
        }
        resetForm();
    } catch (error) {
        console.error("Gagal simpan transaksi:", error);
        showToast("Gagal menyimpan transaksi.", "error");
    }
});

btnCancel.addEventListener("click", () => {
    resetForm();
});

tableBody.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
        return;
    }

    const idEdit = target.getAttribute("data-edit");
    if (idEdit) {
        setEditMode(idEdit);
        return;
    }

    const idDelete = target.getAttribute("data-delete");
    if (idDelete) {
        openDeleteModal(idDelete);
    }
});

btnModalCancel.addEventListener("click", () => {
    closeDeleteModal();
});

confirmModal.addEventListener("click", (event) => {
    if (event.target === confirmModal) {
        closeDeleteModal();
    }
});

btnModalDelete.addEventListener("click", async () => {
    if (!deleteTargetId) {
        closeDeleteModal();
        return;
    }

    try {
        await deleteDoc(doc(db, "kas", deleteTargetId));
        if (editIdEl.value === deleteTargetId) {
            resetForm();
        }
        showToast("Transaksi berhasil dihapus.", "success");
    } catch (error) {
        console.error("Gagal hapus transaksi:", error);
        showToast("Gagal menghapus transaksi.", "error");
    } finally {
        closeDeleteModal();
    }
});

chips.forEach((chip) => {
    chip.addEventListener("click", () => {
        activeFilter = chip.getAttribute("data-filter") || "all";
        updateChipsState();
        renderCurrentView();
    });
});

searchInput.addEventListener("input", () => {
    renderCurrentView();
});

btnLogout.addEventListener("click", async () => {
    try {
        await signOut(auth);
        window.location.href = "login.html";
    } catch (error) {
        console.error("Gagal logout:", error);
        showToast("Gagal logout.", "error");
    }
});

if (btnSettings) {
    btnSettings.addEventListener("click", () => {
        openSettingsModal();
    });
}

if (btnSettingsMenu) {
    btnSettingsMenu.addEventListener("click", () => {
        openSettingsModal();
    });
}

btnSettingsCancel.addEventListener("click", () => {
    closeSettingsModal();
});

settingsModal.addEventListener("click", (event) => {
    if (event.target === settingsModal) {
        closeSettingsModal();
    }
});

rulesForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await saveNewRule();
});

if (rulesResetBtn) {
    rulesResetBtn.addEventListener("click", () => {
        resetRuleForm();
    });
}

if (monthlyForm) {
    monthlyForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        await saveMonthlyChecklist();
    });
}

if (monthlyCancelBtn) {
    monthlyCancelBtn.addEventListener("click", () => {
        resetMonthlyForm();
    });
}

if (monthlyResetBtn) {
    monthlyResetBtn.addEventListener("click", () => {
        resetMonthlyForm();
        showToast("Form checklist direset. Siap untuk input bulan baru.", "success");
    });
}

if (monthlyResetMonthBtn) {
    monthlyResetMonthBtn.addEventListener("click", async () => {
        await resetMonthlyByMonth();
    });
}

document.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
        return;
    }

    const editRuleId = target.getAttribute("data-edit-rule");
    if (editRuleId) {
        editRule(Number(editRuleId));
        return;
    }

    const deleteRuleId = target.getAttribute("data-delete-rule");
    if (deleteRuleId) {
        if (confirm("Hapus peraturan ini?")) {
            await deleteRule(Number(deleteRuleId));
        }
    }

    const editMonthlyId = target.getAttribute("data-edit-monthly");
    if (editMonthlyId) {
        editMonthly(editMonthlyId);
        return;
    }

    const deleteMonthlyId = target.getAttribute("data-delete-monthly");
    if (deleteMonthlyId) {
        if (confirm("Hapus checklist bulanan ini?")) {
            await deleteMonthlyChecklist(deleteMonthlyId);
        }
    }
});

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    await loadSettings();

    const kasQuery = query(collection(db, "kas"), orderBy("tanggal", "desc"));
    onSnapshot(kasQuery, (snapshot) => {
        allItems = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
        renderCurrentView();
    });

    const monthlyQuery = query(collection(db, MONTHLY_COLLECTION), orderBy("bulan", "desc"));
    onSnapshot(monthlyQuery, (snapshot) => {
        monthlyItems = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
        renderMonthlyChecklist(monthlyItems);
        renderDashboardDetails(monthlyItems);
    });
});

updateChipsState();
resetForm();
resetMonthlyForm();
