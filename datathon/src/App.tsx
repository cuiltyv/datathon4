import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  FileSpreadsheet,
  Settings,
  Search,
  Loader2
} from "lucide-react"
import { useState, useMemo } from "react"
import Papa from 'papaparse'

interface RowData {
  id: string;
  values: string[];
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dataMap, setDataMap] = useState<Map<string, string[]>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [searchId, setSearchId] = useState("")
  const [searchResult, setSearchResult] = useState<string[] | null>(null)

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
          const newDataMap = new Map<string, string[]>()
          
          // Skip header row and process data
          results.data.slice(1).forEach((row: string[]) => {
            if (row && row[0]) {
              newDataMap.set(row[0], row)
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

  const handleSearch = (id: string) => {
    setSearchId(id)
    const result = dataMap.get(id)
    setSearchResult(result || null)
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
                    <p className="text-xs text-muted-foreground">Solo archivos CSV (MAX. 10MB)</p>
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

          <div className="pt-4 border-t">
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="mr-2 h-4 w-4" />
              Settings
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
              <h1 className="text-lg font-semibold">Registro</h1>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
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
                          <h3 className="font-medium">Record Details:</h3>
                          <div className="grid gap-2">
                            {searchResult.map((value, index) => (
                              <div key={index} className="p-2 bg-accent rounded-md">
                                {value}
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
        </main>
      </div>
    </div>
  )
}

export default App
