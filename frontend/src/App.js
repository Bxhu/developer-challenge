import React, { useState, Component } from 'react';
import {
  Button,
  CircularProgress,
  LinearProgress,
  ThemeProvider,
  List,
  ListItem,
  ListItemText,
  TextField,
  Snackbar
} from '@material-ui/core';
import MuiAlert from '@material-ui/lab/Alert';
import { createMuiTheme } from '@material-ui/core/styles';
import './App.css';

const theme = createMuiTheme({
  palette: {
    primary: {
      light: '#4c56e6',
      main: '#202ce0',
      dark: '#161e9c',
      contrastText: '#fff',
    },
    secondary: {
      light: '#f15cb9',
      main: '#ee34a8',
      dark: '#a62475',
      contrastText: '#fff',
    },
  },
});

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

function App() {

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [tracks, setTracks] = useState(null);
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [failure, setFailure] = useState(false);

  function onFileChange(event) {
    setFile(event.target.files[0]);
  }

  function handleClose(event, reason) {
    if (reason === 'clickaway') {
      return;
    }

    setOpen(false);
    setSuccess(false);
    setFailure(false);
  }

  async function onFileUpload() {
    setUploading(true);
    setErrorMsg(null);

    let name = (fileName === "") ? file.name : fileName.replace(/\.[^/.]+$/, "");

    const formData = new FormData();
    formData.append('name', name);
    formData.append('file', file);

    try {
      const res = await fetch(`/track`, {
        method: 'POST',
        body: formData
      });
      const {error} = await res.json();
      if (!res.ok) {
        setErrorMsg(error)
      }
    } catch(err) {
      setErrorMsg(err.stack)
    }
    setSuccess(true);
    setOpen(true);
    setFile(null);
    setFileName("");
    setUploading(false);
  }

  async function getTracks() {
    setTracks(null);
    setLoading(true);
    setErrorMsg(null);

    await fetch(`/tracks`)
      .then(res => res.json())
      .then((result) => {
        setTracks(result);
      })
      .catch((error) => {
        setErrorMsg(error);
      })

    console.log(tracks);
    setLoading(false);
  }

  return (
    <div className="main-container">
      <ThemeProvider theme={theme}>
        <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
          <Alert onClose={handleClose} severity="success">
            File uploaded successfully!
          </Alert>
        </Snackbar>
        <div className="file-container">
            {!file &&
              <Button variant="contained" color="primary" component="label">
                Select a file to upload
                <input type="file" style={{ display: "none" }} onChange={onFileChange}/>
              </Button>
            }
            {file &&
              <div className="file-confirm">
                <p>{file.name}</p>
                <TextField label="Name" variant="outlined" size="small" value={fileName} onChange={event => setFileName(event.target.value)} />
                <div className="confirm-buttons">
                  <Button variant="text" style={{ margin: "0px 20px 0px 0px" }} onClick={() => {setFile(null);}} disabled={uploading}>Cancel</Button>
                  <Button variant="contained" color="primary" onClick={onFileUpload} disabled={uploading}>Upload</Button>
                </div>
                {uploading &&
                  <LinearProgress color="primary" style={{ width: "100%" }}/>
                }
              </div>
            }
        </div>
        <div className="tracks-container">
          <Button style={{ margin: "20px" }} variant="contained" color="secondary" onClick={() => getTracks()} disabled={loading}>Get Tracks</Button>
          {!tracks && loading &&
            <CircularProgress color="secondary" />
          }
          <List>
            {tracks && tracks.map(track =>
              <ListItem>
                <ListItemText
                  primary={track.metaData.name}
                  secondary={track.file}
                />
              </ListItem>
            )}
          </List>
        </div>
      </ThemeProvider>
    </div>
  );
}

export default App;
