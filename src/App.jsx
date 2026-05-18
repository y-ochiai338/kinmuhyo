import { useState } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  getAuth,
} from "firebase/auth";

import {
  collection,
  addDoc,
} from "firebase/firestore";

import { db } from "./firebase";

const auth = getAuth();

export default function App() {
  const [user, setUser] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [work, setWork] = useState("");

  const login = async () => {
    try {
      const result = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      setUser(result.user);
    } catch (error) {
      alert("ログイン失敗");
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const addRecord = async () => {
    if (!name || !date || !work) return;

    await addDoc(collection(db, "records"), {
      user: user.email,
      name,
      date,
      work,
    });

    alert("保存しました");

    setName("");
    setDate("");
    setWork("");
  };

  if (!user) {
    return (
      <div style={{ padding: 30 }}>
        <h1>勤務表ログイン</h1>

        <input
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <br />
        <br />

        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <br />
        <br />

        <button onClick={login}>ログイン</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 30 }}>
      <h1>勤務表</h1>

      <p>ログイン中：{user.email}</p>

      <button onClick={logout}>ログアウト</button>

      <hr />

      <input
        placeholder="氏名"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <br />
      <br />

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <br />
      <br />

      <input
        placeholder="勤務内容"
        value={work}
        onChange={(e) => setWork(e.target.value)}
      />

      <br />
      <br />

      <button onClick={addRecord}>保存</button>
    </div>