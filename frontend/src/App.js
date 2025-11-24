import React, { useEffect, useState } from "react";

function App() {
  const [tareas, setTareas] = useState([]);
  const [form, setForm] = useState({ nombre: "", descripcion: "" });

  const API = "https://localhost:3002/api/tareas"; // ← TU BACKEND HTTPS

  // Obtener tareas al cargar
  const fetchTareas = async () => {
    const res = await fetch(API);
    const data = await res.json();
    setTareas(data);
  };

  useEffect(() => {
    fetchTareas();
  }, []);

  // Crear tarea
  const crearTarea = async (e) => {
    e.preventDefault();

    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setForm({ nombre: "", descripcion: "" });
    fetchTareas();
  };

  // Cambiar estado
  const cambiarEstado = async (id) => {
    await fetch(`${API}/estado/${id}`, { method: "PUT" });
    fetchTareas();
  };

  // Eliminar
  const eliminar = async (id) => {
    await fetch(`${API}/${id}`, { method: "DELETE" });
    fetchTareas();
  };

  return (
    <div style={{ padding: "30px", fontFamily: "Arial", color: "white" }}>
      <h1>Gestión de Tareas</h1>

      <form onSubmit={crearTarea}>
        <input
          type="text"
          placeholder="Nombre"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          required
        />
        <br /><br />
        <textarea
          placeholder="Descripción"
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
        ></textarea>
        <br /><br />
        <button type="submit">Crear Tarea</button>
      </form>

      <hr />

      <h2>Lista de Tareas</h2>

      {tareas.length === 0 && <p>No hay tareas</p>}

      <ul>
        {tareas.map((t) => (
          <li key={t.id}>
            <strong>{t.nombre}</strong> — {t.descripcion}  
            <br />
            Estado: {t.estado}
            <br />
            <button onClick={() => cambiarEstado(t.id)}>Cambiar estado</button>
            &nbsp;
            <button onClick={() => eliminar(t.id)}>Eliminar</button>
            <br /><br />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
