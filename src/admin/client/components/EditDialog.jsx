import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Typography
} from '@mui/material';

export default function EditDialog({ open, onClose, row, onSave }) {
  const [values, setValues] = useState(row);

  const handleChange = (field) => (event) => {
    setValues({ ...values, [field]: event.target.value });
  };

  const handleSave = () => {
    onSave(values);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Record</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gap: 2, pt: 2 }}>
          {Object.entries(values || {}).map(([key, value]) => (
            <TextField
              key={key}
              label={key}
              value={value || ''}
              onChange={handleChange(key)}
              fullWidth
              multiline={typeof value === 'object'}
              rows={typeof value === 'object' ? 4 : 1}
            />
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
} 