async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ksebDB", 1);

    request.onupgradeneeded = function(event) {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("pdfs")) {
        db.createObjectStore("pdfs", { keyPath: "filename" });
      }
    };

    request.onsuccess = e => resolve(e.target.result);
    request.onerror = e => reject("❌ Error opening DB: " + e.target.errorCode);
  });
}

async function loadBills() {
  const db = await openDB();
  const tx = db.transaction("pdfs", "readonly");
  const store = tx.objectStore("pdfs");
  const request = store.getAll();

  request.onsuccess = function() {
    const bills = request.result;
    const tbody = document.querySelector("#historyTable tbody");
    tbody.innerHTML = "";
    bills.forEach(bill => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${bill.date}</td>
        <td>${bill.consumerNo}</td>
        <td>${bill.billType}</td>
        <td>₹${bill.totalCharge}</td>
        <td><button onclick="downloadBill('${bill.filename}')">⬇️ Download</button></td>
        <td><button onclick="deleteBill('${bill.filename}')">❌ Delete</button></td>
      `;
      tbody.appendChild(row);
    });
  };
}

async function downloadBill(filename) {
  const db = await openDB();
  const tx = db.transaction("pdfs", "readonly");
  const store = tx.objectStore("pdfs");
  const request = store.get(filename);

  request.onsuccess = function() {
    const bill = request.result;
    if (bill) {
      const url = URL.createObjectURL(bill.pdf);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  };
}

async function deleteBill(filename) {
  const db = await openDB();
  const tx = db.transaction("pdfs", "readwrite");
  tx.objectStore("pdfs").delete(filename);
  tx.oncomplete = () => loadBills();
}

async function clearAllBills() {
  const db = await openDB();
  const tx = db.transaction("pdfs", "readwrite");
  tx.objectStore("pdfs").clear();
  tx.oncomplete = () => loadBills();
}

window.onload = loadBills;
