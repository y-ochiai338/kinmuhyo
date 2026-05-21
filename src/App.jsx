import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,   // ←ここに統合（重要）
} from "firebase/auth";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

import { db, auth } from "./firebase";

export default function App() {
  const [user, setUser] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [work, setWork] = useState("");
  const [distance, setDistance] = useState("");

  const [records, setRecords] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [editId, setEditId] = useState(null);

  const [error, setError] = useState("");

  const adminEmail = "y_ochiai@lifelong-sport.jp";
  const isAdmin = user?.email === adminEmail;

  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // -----------------------------
  // 🔐 ログイン保持（ここが追加ポイント）
  // -----------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // -----------------------------
  // PWA install
  // -----------------------------
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const installApp = async () => {
    try {
      if (!deferredPrompt) {
        alert("インストールできません");
        return;
      }
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } catch (e) {
      console.error(e);
    }
  };

  // -----------------------------
  // Firestore取得
  // -----------------------------
  const fetchRecords = async () => {
    try {
      const snap = await getDocs(collection(db, "records"));

      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setRecords(data);
    } catch (e) {
      console.error(e);
      setError("データ取得エラー");
    }
  };

  useEffect(() => {
    if (user) fetchRecords();
  }, [user]);

  // -----------------------------
  // login
  // -----------------------------
  const login = async () => {
    try {
      setError("");
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      console.error(e);
      setError("ログイン失敗");
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  // -----------------------------
  // CRUD
  // -----------------------------
  const addRecord = async () => {
    await addDoc(collection(db, "records"), {
      name,
      date,
      work,
      distance,
      user: user?.email || "",
    });

    setName("");
    setDate("");
    setWork("");
    setDistance("");

    fetchRecords();
  };

  const deleteRecord = async (id) => {
    if (!window.confirm("削除しますか？")) return;

    await deleteDoc(doc(db, "records", id));
    fetchRecords();
  };

  const editRecord = (r) => {
    setEditId(r.id);
    setName(r.name || "");
    setDate(r.date || "");
    setWork(r.work || "");
    setDistance(r.distance || "");
  };

  const updateRecord = async () => {
    await updateDoc(doc(db, "records", editId), {
      name,
      date,
      work,
      distance,
    });

    setEditId(null);
    setName("");
    setDate("");
    setWork("");
    setDistance("");

    fetchRecords();
  };

  // -----------------------------
  // filter
  // -----------------------------
  const filteredRecords = records.filter((r) => {
    const monthMatch = selectedMonth
      ? r.date?.slice(0, 7) === selectedMonth
      : true;

    const userMatch = isAdmin ? true : r.user === user?.email;

    return monthMatch && userMatch;
  });

  // -----------------------------
  // Excel
  // -----------------------------
  const exportExcel = () => {
    const data = filteredRecords.map((r) => ({
      氏名: r.name || "",
      日付: r.date || "",
      勤務内容: r.work || "",
      活動距離: r.distance || "",
      担当者: r.user || "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "勤務表");

    XLSX.writeFile(
      wb,
      `勤務表_${selectedMonth || "全期間"}.xlsx`
    );
  };

  // -----------------------------
  // ログイン前
  // -----------------------------
  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>勤務表アプリ</h2>

          {error && <p style={{ color: "red" }}>{error}</p>}

          <input
            style={styles.input}
            placeholder="メール"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            style={styles.input}
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button style={styles.button} onClick={login}>
            ログイン
          </button>

          <button style={styles.button} onClick={installApp}>
            インストール
          </button>
        </div>
      </div>
    );
  }

  // -----------------------------
  // メイン画面
  // -----------------------------
  return (
    <div style={styles.container}>
      <h2>勤務表</h2>

      <p>ログイン中：{user?.email}</p>

      {isAdmin && <h4>管理者モード</h4>}

      <button style={styles.button} onClick={logout}>
        ログアウト
      </button>

      <hr />

      <input
        style={styles.input}
        placeholder="氏名"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        style={styles.input}
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <input
        style={styles.input}
        placeholder="勤務内容"
        value={work}
        onChange={(e) => setWork(e.target.value)}
      />

      <input
        style={styles.input}
        placeholder="活動距離"
        value={distance}
        onChange={(e) => setDistance(e.target.value)}
      />

      {editId ? (
        <button style={styles.button} onClick={updateRecord}>
          更新
        </button>
      ) : (
        <button style={styles.button} onClick={addRecord}>
          保存
        </button>
      )}

      <hr />

      <input
        type="month"
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
      />

      <button style={styles.button} onClick={exportExcel}>
        Excel出力
      </button>

      <hr />

      {filteredRecords.length === 0 ? (
        <p>データなし</p>
      ) : (
        filteredRecords.map((r) => (
          <div key={r.id} style={styles.card}>
            <p>氏名：{r.name}</p>
            <p>日付：{r.date}</p>
            <p>勤務：{r.work}</p>
            <p>距離：{r.distance}</p>
            <p>担当：{r.user}</p>

            <button style={styles.small} onClick={() => editRecord(r)}>
              編集
            </button>

            <button style={styles.small} onClick={() => deleteRecord(r.id)}>
              削除
            </button>
          </div>
        ))
      )}
    </div>
  );
}

// -----------------------------
const styles = {
  container: {
    padding: 20,
    maxWidth: 600,
    margin: "0 auto",
    backgroundColor: "#f4f6f9",
    minHeight: "100vh",
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 10,
    border: "1px solid #ccc",
    borderRadius: 6,
  },
  button: {
    width: "100%",
    padding: 12,
    marginBottom: 10,
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: 6,
  },
  small: {
    marginRight: 10,
    padding: 6,
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: 4,
  },
  card: {
    border: "1px solid #ddd",
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    background: "white",
  },
};