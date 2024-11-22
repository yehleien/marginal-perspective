import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, TextField, Button, Table, 
         TableBody, TableCell, TableHead, TableRow, Paper } from '@mui/material';
import EditDialog from './components/EditDialog';
import { IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

function App() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [editRow, setEditRow] = useState(null);

  const fetchTables = async () => {
    const res = await fetch('/api/schema', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setTables(data[0]);
  };

  const fetchTableData = async (tableName) => {
    const res = await fetch(`/api/table/${tableName}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setData(data[0]);
    setSelectedTable(tableName);
  };

  useEffect(() => {
    if (token) fetchTables();
  }, [token]);

  const filteredData = data.filter(row => 
    Object.values(row).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleEdit = async (updatedRow) => {
    try {
      const res = await fetch(`/api/table/${selectedTable}/${updatedRow.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updatedRow)
      });

      if (!res.ok) throw new Error('Update failed');

      // Refresh table data
      fetchTableData(selectedTable);
    } catch (error) {
      console.error('Edit error:', error);
      // Add error handling UI here
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Marginal Perspective Admin
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Search"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mr: 2 }}
          />
        </Box>

        <Box sx={{ display: 'flex', mb: 2 }}>
          {tables.map(table => (
            <Button 
              key={table.table_name}
              variant={selectedTable === table.table_name ? "contained" : "outlined"}
              onClick={() => fetchTableData(table.table_name)}
              sx={{ mr: 1 }}
            >
              {table.table_name}
            </Button>
          ))}
        </Box>

        <Table>
          <TableHead>
            <TableRow>
              {Object.keys(data[0] || {}).map(key => (
                <TableCell key={key}>{key}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.map((row, i) => (
              <TableRow key={i}>
                {Object.values(row).map((value, j) => (
                  <TableCell key={j}>
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </TableCell>
                ))}
                <TableCell>
                  <IconButton onClick={() => setEditRow(row)}>
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <EditDialog 
          open={Boolean(editRow)}
          onClose={() => setEditRow(null)}
          row={editRow}
          onSave={handleEdit}
        />
      </Box>
    </Container>
  );
}

export default App; 