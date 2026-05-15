import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

export default function App() {
  const [records, setRecords] = useState([]);

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [work, setWork] = useState("");
  const [distance, setDistance] = useState("");
  const [shortTime, setShortTime] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "records"),
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setRecords(list);
      }
    );

    return () => unsubscribe();
  }, []);

  const addRecord = async () => {
    if (!name || !date || !work) return;

    await addDoc(collection(db, "records"), {
      name,
      date,
      work,
      distance,
      shortTime,
    });

    setName("");
    setDate("");
    setWork("");
    setDistance("");
    setShortTime(false);
  };

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>勤務表</h1>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          maxWidth: 400,
        }}
      >
        <input
          placeholder="氏名"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <input
          placeholder="勤務内容"
          value={work}
          onChange={(e) => setWork(e.target.value)}
        />

        <input
          placeholder="活動距離"
          value={distance}
          onChange={(e) => setDistance(e.target.value)}
        />

        <label>
          <input
            type="checkbox"
            checked={shortTime}
            onChange={(e) => setShortTime(e.target.checked)}
          />
          5時間以内
        </label>

        <button onClick={addRecord}>追加</button>
      </div>

      <hr />

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>氏名</th>
            <th>日付</th>
            <th>勤務内容</th>
            <th>活動距離</th>
            <th>5時間以内</th>
          </tr>
        </thead>

        <tbody>
          {records.map((r) => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.date}</td>
              <td>{r.work}</td>
              <td>{r.distance}</td>
              <td>{r.shortTime ? "✔" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}