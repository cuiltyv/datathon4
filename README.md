# datathon4
Repo de datathon


# Como correr? GUIDE

entrar al folder
- cd datathon

(Revisar si se tiene npm installado (NODE)) sino installarlo

instalar paquetes (estar adentro del folder de datathon)
- npm i

correr
- npm run dev

(Donde se encuentra el codigo?)

Adentro de el folder de src en el archivo de App.tsx esta todo el codigo

Si estan corriendo la api localmente, puede salir problema de CORS, resolverlo como sale en el folder de backend en datathon, ejemplo con api basica



# HeyPredictor 📊🔮  
Equipo: 404 Data Not Found
**Predicción de gastos recurrentes para Hey Banco**

Este proyecto proporciona una solución completa para **detectar patrones de gastos recurrentes** en los clientes de Hey Banco y **predecir el monto y el tiempo estimado hasta la siguiente transacción**. Está dividido en dos componentes principales:

- Un notebook de entrenamiento y generación de features (`hey_predictions.ipynb`)
- Una aplicación fullstack (React + Flask API) para hacer predicciones en tiempo real a partir de CSVs nuevos.

---

## 🧠 Lógica del modelo

### `hey_predictions.ipynb` contiene:

1. **Exploración de datos (EDA)**  
   Se analizan tendencias generales, distribución de montos y periodicidad de transacciones por cliente-comercio.

2. **Limpieza y procesamiento**  
   - Conversión de fechas
   - Relleno y eliminación de valores nulos
   - Agrupaciones por cliente y comercio

3. **Ingeniería de features**  
   Para cada combinación cliente-comercio se generan:
   - `dias_desde_ultima`
   - `monto`
   - `media_monto_hist`
   - `std_monto_hist`
   - `num_tx_cliente_comercio`

4. **Clasificación heurística de gastos recurrentes**  
   Basado en:
   - Frecuencia mínima de transacciones (≥ 3)
   - Intervalo regular (mediana de días ≤ 45)
   - Baja variabilidad del monto (desviación estándar < 30% de la media)

   ```python
   frecuencia['es_recurrente'] = (
       (frecuencia['num_transacciones'] >= 3) &
       (frecuencia['dias_entre'] <= 45) &
       (frecuencia['monto_std'] < 0.3 * frecuencia['monto_promedio'])
   )
  ```
5. **Entrenamiento de modelos Random Forest Regressor**  
   - Un modelo para predecir el **monto estimado**
   - Otro para predecir los **días hasta la siguiente compra**

6. **Generación del dataset para producción**  
   Se genera un nuevo `.csv` que incluye **una fila por cliente-comercio** correspondiente a la **última transacción conocida**, junto con sus features calculadas.

7. **Exportación de modelos**  
   Los modelos entrenados se guardan como `.joblib` para ser utilizados por la aplicación.

---

## 🧩 Aplicación React + Flask API

### Estructura
- **Frontend**: construida con Vite + React + Tailwind. Permite:
  - Subir CSVs con transacciones históricas
  - Buscar por ID de cliente
  - Visualizar gráficas por tipo de venta, comercio, monto en el tiempo
  - Ejecutar predicciones fila por fila

- **Backend**: Servidor Flask que expone un endpoint `/predict` y usa los modelos `.joblib` para responder con:
  ```json
  {
    "monto_estimado": 123.45,
    "dias_estimados": 30
  }

---

## 🚀 Cómo ejecutar la aplicación

### 1. Clona el repositorio

```bash
git clone https://github.com/tu-usuario/hey-predictor.git
cd hey-predictor
```

### 2. Ejecuta el notebook

Abre el archivo `hey_predictions.ipynb` y corre todas las celdas de principio a fin:

- Esto generará un archivo `.csv` de entrada que la aplicación utilizará para hacer predicciones.
- También entrenará y guardará dos modelos como `model1.pkl` (para monto estimado) y `model2.pkl` (para días estimados).

Asegúrate de tener todas las dependencias necesarias instaladas mediante el archivo `requirements.txt`.

### 3. Copia los modelos al backend

Una vez generados los modelos, colócalos en la carpeta `backend/`. Esta carpeta es donde reside el servidor Flask que usará dichos modelos para responder a las solicitudes de predicción.

### 4. Corre el backend Flask

Desde la carpeta `backend`, ejecuta el servidor Flask. Esto iniciará la API local que responde a las predicciones en la ruta `/predict`.

La API estará disponible en `http://127.0.0.1:5000`.

### 5. Corre el frontend React

Desde la carpeta `frontend`, instala las dependencias necesarias y luego levanta la app en modo desarrollo.

La interfaz estará accesible en `http://localhost:5173`.

---

## 🔁 Replicabilidad paso a paso

1. Ejecuta el notebook `hey_predictions.ipynb`.
2. Guarda los modelos `.joblib` o `.pkl` en la carpeta `backend/`.
3. Ejecuta el servidor Flask.
4. Levanta el frontend con Vite.
5. Sube un nuevo archivo CSV, busca por ID de cliente y obtén las predicciones fila por fila.

---

## ✨ Autoría y agradecimientos

Este proyecto fue desarrollado para propósitos de análisis predictivo para Hey Banco.  
El enfoque está inspirado en patrones reales de comportamiento financiero y técnicas modernas de machine learning.

---

## 📦 Requisitos sugeridos (`requirements.txt`)

- pandas  
- numpy  
- scikit-learn  
- joblib  
- flask  
- flask-cors  
- jupyter  
- matplotlib  
- seaborn

