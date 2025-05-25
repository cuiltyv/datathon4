import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  FileSpreadsheet,
  Search,
  Loader2,
  BarChart3,
  Table
} from "lucide-react"
import { useState } from "react"
import Papa from 'papaparse'
import axios from 'axios'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { PieLabelRenderProps as PieLabelRenderPropsType } from 'recharts'
import { BarChart as ReBarChart, Bar, XAxis, YAxis, Legend } from 'recharts'
import { LineChart, Line } from 'recharts'

const api = axios.create({
  baseURL: 'http://127.0.0.1:5000',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
})

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [graphFile, setGraphFile] = useState<File | null>(null)
  const [dataMap, setDataMap] = useState<Map<string, string[][]>>(new Map())
  const [graphDataMap, setGraphDataMap] = useState<Map<string, string[][]>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [isGraphLoading, setIsGraphLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [searchId, setSearchId] = useState("")
  const [graphSearchId, setGraphSearchId] = useState("")
  const [searchResult, setSearchResult] = useState<string[][] | null>(null)
  const [predictions, setPredictions] = useState<Map<number, number>>(new Map())
  const [isPredicting, setIsPredicting] = useState(false)
  const [currentView, setCurrentView] = useState<'records' | 'graphs'>('records')

  const getPrediction = async (data: string[], recordIndex: number) => {
    try {
      const response = await api.post('/predict', { data })
      setPredictions(prev => new Map(prev).set(recordIndex, response.data.prediction))
    } catch (error) {
      console.error('Error getting prediction:', error)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setIsLoading(true)
      setProgress(0)
      setDataMap(new Map())
      setSearchResult(null)

      Papa.parse(file, {
        complete: (results) => {
          console.log('Parsing complete:', results.data.length, 'rows')
          
          // Create a new Map to store the data
          const newDataMap = new Map<string, string[][]>()
          
          // Skip header row and process data
          results.data.slice(1).forEach((row: unknown) => {
            if (Array.isArray(row) && row[0]) {
              const id = row[0]
              const existingRecords = newDataMap.get(id) || []
              newDataMap.set(id, [...existingRecords, row])
            }
          })
          
          console.log('Processed rows:', newDataMap.size)
          setDataMap(newDataMap)
          setIsLoading(false)
        },
        error: (error) => {
          console.error('Error parsing CSV:', error)
          setIsLoading(false)
        },
        header: false,
        skipEmptyLines: true
      })
    }
  }

  const handleGraphFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setGraphFile(file)
      setIsGraphLoading(true)
      setProgress(0)
      setGraphDataMap(new Map())

      Papa.parse(file, {
        complete: (results) => {
          console.log('Parsing complete:', results.data.length, 'rows')
          
          // Create a new Map to store the data
          const newDataMap = new Map<string, string[][]>()
          
          // Skip header row and process data
          results.data.slice(1).forEach((row: unknown) => {
            if (Array.isArray(row) && row[0]) {
              const id = row[0]
              const existingRecords = newDataMap.get(id) || []
              newDataMap.set(id, [...existingRecords, row])
            }
          })
          
          console.log('Processed rows:', newDataMap.size)
          setGraphDataMap(newDataMap)
          setIsGraphLoading(false)
        },
        error: (error) => {
          console.error('Error parsing CSV:', error)
          setIsGraphLoading(false)
        },
        header: false,
        skipEmptyLines: true
      })
    }
  }

  const handleSearch = (id: string) => {
    setSearchId(id)
    const result = dataMap.get(id)
    setSearchResult(result || null)
    setPredictions(new Map()) // Reset predictions when searching for a new record
  }

  const handlePredict = async () => {
    if (searchResult && searchResult.length > 0) {
      setIsPredicting(true)
      setPredictions(new Map()) // Reset predictions
      
      // Create an array of promises for all predictions
      const predictionPromises = searchResult.map((record, index) => 
        getPrediction(record, index)
      )
      
      // Wait for all predictions to complete
      await Promise.all(predictionPromises)
      setIsPredicting(false)
    }
  }

  const handleGraphSearch = (id: string) => {
    setGraphSearchId(id)
    const result = graphDataMap.get(id)
    if (result) {
      setSearchResult(result)
    } else {
      setSearchResult(null)
    }
  }

  // Custom label for pie chart
  const renderPieLabel = (props: PieLabelRenderPropsType) => {
    let { cx, cy, innerRadius, outerRadius } = props
    const { midAngle, value, name } = props
    const percent = props.percent ?? 0
    // Provide defaults if undefined
    cx = typeof cx === 'number' ? cx : 0
    cy = typeof cy === 'number' ? cy : 0
    innerRadius = typeof innerRadius === 'number' ? innerRadius : 0
    outerRadius = typeof outerRadius === 'number' ? outerRadius : 0
    const RADIAN = Math.PI / 180
    // Calculate label position
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return (
      <text x={x} y={y} fill="#222" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={13} fontWeight={500}>
        {name}: {value} ({(percent * 100).toFixed(0)}%)
      </text>
    )
  }

  const renderGraphsView = () => {
    // Calculate statistics if there is a search result
    let totalMonto = 0
    const tipoVentaCounts: Record<string, number> = {}
    if (searchResult && searchResult.length > 0) {
      searchResult.forEach(record => {
        // Assuming columns: id, fecha, comercio, giro_comercio, tipo_venta, monto
        // monto is last column, tipo_venta is second to last
        const montoStr = record[record.length - 1]
        const tipoVenta = record[record.length - 2]
        const monto = parseFloat(montoStr)
        if (!isNaN(monto)) totalMonto += monto
        if (tipoVenta) {
          tipoVentaCounts[tipoVenta] = (tipoVentaCounts[tipoVenta] || 0) + 1
        }
      })
    }
    const pieData = Object.entries(tipoVentaCounts).map(([key, value]) => ({ name: key, value }))
    const pieColors = ['#6366f1', '#f59e42', '#10b981', '#ef4444', '#fbbf24']

    // Aggregate by comercio
    let comercioStats: { comercio: string, count: number, monto: number }[] = []
    if (searchResult && searchResult.length > 0) {
      const comercioMap: Record<string, { count: number, monto: number }> = {}
      searchResult.forEach(record => {
        // Assuming columns: id, fecha, comercio, giro_comercio, tipo_venta, monto
        const comercio = record[2] || 'N/A'
        const monto = parseFloat(record[record.length - 1])
        if (!comercioMap[comercio]) {
          comercioMap[comercio] = { count: 0, monto: 0 }
        }
        comercioMap[comercio].count += 1
        if (!isNaN(monto)) comercioMap[comercio].monto += monto
      })
      comercioStats = Object.entries(comercioMap).map(([comercio, stats]) => ({ comercio, ...stats }))
    }

    const fisicaCount = tipoVentaCounts['fisica'] || 0
    const digitalCount = tipoVentaCounts['digital'] || 0

    // Prepare data for line chart: monto per fecha
    let montoTimeData: { fecha: string, monto: number }[] = []
    if (searchResult && searchResult.length > 0) {
      montoTimeData = searchResult
        .map(record => {
          // Assuming columns: id, fecha, comercio, giro_comercio, tipo_venta, monto
          const fecha = record[1] || ''
          const monto = parseFloat(record[record.length - 1])
          return { fecha, monto }
        })
        .filter(d => d.fecha && !isNaN(d.monto))
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    }

    return (
      <div className="space-y-6">
        {/* CSV Upload Section for Graphs */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Data for Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label 
                  htmlFor="graph-csv-upload" 
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-background hover:bg-accent"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {isGraphLoading ? (
                      <Loader2 className="w-8 h-8 mb-2 text-muted-foreground animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-8 h-8 mb-2 text-muted-foreground" />
                    )}
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click para subir archivo CSV</span> o drag y drop
                    </p>
                    <p className="text-xs text-muted-foreground">Solo archivos CSV (MAX. 50MB)</p>
                  </div>
                  <input 
                    id="graph-csv-upload" 
                    type="file" 
                    className="hidden" 
                    accept=".csv"
                    onChange={handleGraphFileChange}
                    disabled={isGraphLoading}
                  />
                </label>
              </div>
              {graphFile && (
                <div className="flex items-center gap-2 p-2 bg-accent rounded-md">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate">{graphFile.name}</span>
                  {isGraphLoading && (
                    <span className="text-sm text-muted-foreground">
                      Processing... {progress.toLocaleString()} rows
                    </span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Search Box */}
        {graphDataMap.size > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Search Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Enter ID to search..."
                    className="pl-8"
                    value={graphSearchId}
                    onChange={(e) => handleGraphSearch(e.target.value)}
                  />
                </div>
                {searchResult && (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Total Monto</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col md:flex-row md:items-center md:gap-6">
                          <div className="text-2xl font-bold">${totalMonto.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                          <div className="flex gap-4 mt-2 md:mt-0">
                            <span className="inline-flex items-center px-2 py-1 rounded bg-accent text-xs font-medium">
                              Fisica: <span className="ml-1 font-bold">{fisicaCount}</span>
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded bg-accent text-xs font-medium">
                              Digital: <span className="ml-1 font-bold">{digitalCount}</span>
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Tipo de Venta (Pie Chart)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64 w-full flex items-center justify-center">
                          {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                              <PieChart>
                                <Pie
                                  data={pieData}
                                  dataKey="value"
                                  nameKey="name"
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={70}
                                  label={renderPieLabel}
                                >
                                  {pieData.map((entry, idx) => (
                                    <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <span className="text-muted-foreground">No tipo_venta data</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Transacciones por Comercio</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-72 w-full flex items-center justify-center">
                          {comercioStats.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                              <ReBarChart data={comercioStats} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                                <XAxis dataKey="comercio" fontSize={12} tick={{ fill: '#888' }} angle={-20} interval={0} height={60} />
                                <YAxis fontSize={12} tick={{ fill: '#888' }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="count" fill="#6366f1" name="Transacciones" />
                              </ReBarChart>
                            </ResponsiveContainer>
                          ) : (
                            <span className="text-muted-foreground">No comercio data</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Monto por Comercio</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-72 w-full flex items-center justify-center">
                          {comercioStats.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                              <ReBarChart data={comercioStats} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                                <XAxis dataKey="comercio" fontSize={12} tick={{ fill: '#888' }} angle={-20} interval={0} height={60} />
                                <YAxis fontSize={12} tick={{ fill: '#888' }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="monto" fill="#f59e42" name="Monto" />
                              </ReBarChart>
                            </ResponsiveContainer>
                          ) : (
                            <span className="text-muted-foreground">No comercio data</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Monto a lo largo del tiempo</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-72 w-full flex items-center justify-center">
                          {montoTimeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                              <LineChart data={montoTimeData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                                <XAxis
                                  dataKey="fecha"
                                  fontSize={12}
                                  tick={{ fill: '#888' }}
                                  angle={-20}
                                  interval={25}
                                  height={60}
                                  tickFormatter={date => date.slice(0, 10)}
                                />
                                <YAxis fontSize={12} tick={{ fill: '#888' }} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="monto" stroke="#6366f1" name="Monto" dot />
                              </LineChart>
                            </ResponsiveContainer>
                          ) : (
                            <span className="text-muted-foreground">No monto/time data</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  {searchResult 
                    ? "Record found" 
                    : "Enter an ID to search for a record"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 border-r bg-card">
        <div className="flex h-16 items-center border-b px-6">
          <h2 className="text-lg font-semibold">HeyBanco</h2>
        </div>
        <nav className="space-y-4 p-4">
          {/* CSV Upload Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Upload CSV</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-center w-full">
                <label 
                  htmlFor="csv-upload" 
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-background hover:bg-accent"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {isLoading ? (
                      <Loader2 className="w-8 h-8 mb-2 text-muted-foreground animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-8 h-8 mb-2 text-muted-foreground" />
                    )}
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click para subir archivo CSV</span> o drag y drop
                    </p>
                    <p className="text-xs text-muted-foreground">Solo archivos CSV (MAX. 50MB)</p>
                  </div>
                  <input 
                    id="csv-upload" 
                    type="file" 
                    className="hidden" 
                    accept=".csv"
                    onChange={handleFileChange}
                    disabled={isLoading}
                  />
                </label>
              </div>
              {selectedFile && (
                <div className="flex items-center gap-2 p-2 bg-accent rounded-md">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate">{selectedFile.name}</span>
                  {isLoading && (
                    <span className="text-sm text-muted-foreground">
                      Processing... {progress.toLocaleString()} rows
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="pt-4 border-t space-y-2">
            <Button 
              variant={currentView === 'records' ? 'default' : 'ghost'} 
              className="w-full justify-start"
              onClick={() => setCurrentView('records')}
            >
              <Table className="mr-2 h-4 w-4" />
              Records View
            </Button>
            <Button 
              variant={currentView === 'graphs' ? 'default' : 'ghost'} 
              className="w-full justify-start"
              onClick={() => setCurrentView('graphs')}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Graphs View
            </Button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b bg-background">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold">
                {currentView === 'records' ? 'Registro' : 'Análisis Gráfico'}
              </h1>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {currentView === 'records' ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dataMap.size.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {searchResult ? "Record found" : "Search by ID"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Status</CardTitle>
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {isLoading ? "Processing..." : "Ready"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isLoading ? `${progress.toLocaleString()} rows processed` : "Search by ID"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Search Records</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          <span className="ml-2 text-sm text-muted-foreground">
                            Loading data... {progress.toLocaleString()} rows processed
                          </span>
                        </div>
                      ) : dataMap.size > 0 ? (
                        <div className="space-y-4">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="search"
                              placeholder="Enter ID to search..."
                              className="pl-8"
                              value={searchId}
                              onChange={(e) => handleSearch(e.target.value)}
                            />
                          </div>
                          {searchResult && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium">Record Details:</h3>
                                <Button 
                                  onClick={handlePredict}
                                  disabled={isPredicting}
                                  size="sm"
                                >
                                  {isPredicting ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Getting Predictions...
                                    </>
                                  ) : (
                                    'Get All Predictions'
                                  )}
                                </Button>
                              </div>
                              <div className="space-y-4">
                                {searchResult.map((record, recordIndex) => (
                                  <div key={recordIndex} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-sm font-medium text-muted-foreground">
                                        Record {recordIndex + 1}
                                      </h4>
                                      {predictions.has(recordIndex) && (
                                        <div className="text-sm font-medium text-primary">
                                          Prediction: {predictions.get(recordIndex)}
                                        </div>
                                      )}
                                    </div>
                                    <div className="grid gap-2">
                                      {record.map((value, index) => (
                                        <div key={index} className="p-2 bg-accent rounded-md">
                                          {value}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {searchResult 
                              ? "Record found" 
                              : "Enter an ID to search for a record"}
                          </p>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">
                          Upload a CSV file to search records
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            renderGraphsView()
          )}
        </main>
      </div>
    </div>
  )
}

export default App
