import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
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
  const [underFiveHours, setUnderFiveHours] = useState(false);

  const [records, setRecords] = useState([]);

  const [selectedMonth, setSelectedMonth] = useState("");
  const [editingId, setEditingId] = useState(null);
  const adminEmail = "y_ochiai@lifelong-sport.jp";
  const isAdmin = user?.email === adminEmail;

  // ログイン保持
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return () => unsub();
  }, []);

  // データ取得
  const fetchRecords = async () => {
    const snap = await getDocs(collection(db, "kinmu"));

    const data = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    setRecords(data);
  };

  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [user]);

  // ログイン
  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      alert("ログイン失敗");
    }
  };

  // ログアウト
  const logout = async () => {
    await signOut(auth);
  };

  // 保存
  const addRecord = async () => {
  try {
    if (editingId) {
      await updateDoc(doc(db, "kinmu", editingId), {
        name,
        date,
        work,
        distance,
        underFiveHours,
        user: user.email,
      });

      alert("更新しました");
      setEditingId(null);
    } else {
      await addDoc(collection(db, "kinmu"), {
        name,
        date,
        work,
        distance,
        underFiveHours,
        user: user.email,
      });

      alert("保存しました");
    }

    setName("");
    setDate("");
    setWork("");
    setDistance("");
    setUnderFiveHours(false);

    fetchRecords();
  } catch (e) {
    console.log(e);
  }

  // 削除
  const editRecord = (r) => {
  setEditingId(r.id);

  setName(r.name || "");
  setDate(r.date || "");
  setWork(r.work || "");
  setDistance(r.distance || "");
  setUnderFiveHours(r.underFiveHours || false);

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};
  const deleteRecord = async (id) => {
    if (!window.confirm("削除しますか？")) return;

    await deleteDoc(doc(db, "kinmu", id));

    fetchRecords();
  };

  // フィルター
  const filteredRecords = records.filter((r) => {
    const monthMatch = selectedMonth
      ? r.date?.slice(0, 7) === selectedMonth
      : true;

    const userMatch = isAdmin
      ? true
      : r.user === user?.email;

    return monthMatch && userMatch;
  });

  // Excel出力
  const exportExcel = () => {
    const data = filteredRecords.map((r) => ({
      名前: r.name,
      日付: r.date,
      勤務内容: r.work,
      活動距離: r.distance,
      "5時間以内": r.underFiveHours ? "✔" : "",
      担当者: r.user,
    }));

    const ws = XLSX.utils.json_to_sheet(data);

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "勤務表");

    XLSX.writeFile(
      wb,
      `勤務表_${selectedMonth || "全期間"}.xlsx`
    );
  };

  // ログイン前
  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>勤務表アプリ</h2>

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
        </div>
      </div>
    );
  }

  // メイン画面
  return (
    <div style={styles.container}>
      <h2>勤務表アプリ</h2>

      <p>ログイン中：{user.email}</p>

      {isAdmin && <h3>管理者モード</h3>}

      <button style={styles.logout} onClick={logout}>
        ログアウト
      </button>

      <div style={styles.card}>
        <input
          style={styles.input}
          placeholder="名前"
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

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "12px",
          }}
        >
          <input
            type="checkbox"
            checked={underFiveHours}
            onChange={(e) =>
              setUnderFiveHours(e.target.checked)
            }
          />
          5時間以内
        </label>

        <button style={styles.button} onClick={addRecord}>
       {editingId ? "更新" : "保存"}
       </button>

        <hr />

        <input
          style={styles.input}
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        />

        <button style={styles.excel} onClick={exportExcel}>
          Excel出力
        </button>
      </div>

      {filteredRecords.map((r) => (
        <div key={r.id} style={styles.record}>
          <p>名前：{r.name}</p>
          <p>日付：{r.date}</p>
          <p>勤務内容：{r.work}</p>
          <p>活動距離：{r.distance}</p>

          <p>
            5時間以内：
            {r.underFiveHours ? "✔" : ""}
          </p>

          <p>担当者：{r.user}</p>

<button
  style={{
    padding: 8,
    background: "#f59e0b",
    color: "white",
    border: "none",
    borderRadius: 6,
    marginRight: 8,
  }}
  onClick={() => editRecord(r)}
>
  編集
</button>

<button
  style={styles.delete}
  onClick={() => deleteRecord(r.id)}
>
  削除
</button>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 600,
    margin: "0 auto",
    padding: 20,
    background: "#f4f6f9",
    minHeight: "100vh",
  },

  card: {
    background: "white",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },

  input: {
    width: "100%",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    border: "1px solid #ccc",
    fontSize: 16,
  },

  button: {
    width: "100%",
    padding: 12,
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
  },

  excel: {
    width: "100%",
    padding: 12,
    background: "#16a34a",
    color: "white",
    border: "none",
    borderRadius: 8,
    fontSize: 16,
  },

  logout: {
    width: "100%",
    padding: 10,
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: 8,
    marginBottom: 20,
  },

  record: {
    background: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },

  delete: {
    padding: 8,
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: 6,
  },
};