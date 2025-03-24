import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
  Container, 
  CssBaseline, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  AppBar,
  Toolbar,
  IconButton,
  InputBase,
  Chip,
  Avatar,
  alpha,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Menu,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  Alert
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import SearchIcon from '@mui/icons-material/Search';
import TimelineIcon from '@mui/icons-material/Timeline';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import FilterListIcon from '@mui/icons-material/FilterList';
import MenuIcon from '@mui/icons-material/Menu';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#b71c1c',
    },
    secondary: {
      main: '#ffd700',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(145deg, #1e1e1e 0%, #2d2d2d 100%)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#b71c1c',
          color: '#ffffff',
          fontWeight: 'bold',
        },
      },
    },
  },
});

const DEATH_CAUSES = [
  'Natural Causes',
  'Assassination',
  'Execution',
  'Died in Battle',
  'Suicide',
  'Unknown'
];

function parseCSV(csv) {
  const lines = csv.split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    return headers.reduce((obj, header, index) => {
      obj[header.trim()] = values[index]?.trim() || '';
      return obj;
    }, {});
  });
}

function formatDate(dateStr) {
  if (!dateStr) return 'Unknown';
  try {
    const date = new Date(dateStr);
    const year = Math.abs(date.getFullYear());
    const era = date.getFullYear() < 0 ? 'BCE' : 'CE';
    return `${year} ${era}`;
  } catch {
    return 'Unknown';
  }
}

function App() {
  const [emperors, setEmperors] = useState([]);
  const [dynastyStats, setDynastyStats] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDynasty, setSelectedDynasty] = useState('');
  const [selectedCause, setSelectedCause] = useState('');
  const [timeRange, setTimeRange] = useState({ start: '', end: '' });
  const [dynasties, setDynasties] = useState([]);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [gameDialogOpen, setGameDialogOpen] = useState(false);
  const [currentGame, setCurrentGame] = useState(null);
  const [gameAnswer, setGameAnswer] = useState('');
  const [gameResult, setGameResult] = useState(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    fetch('/romen-emperors/roman-emperors.csv')
      .then((response) => response.text())
      .then((csv) => {
        const records = parseCSV(csv);
        setEmperors(records);
        
        const uniqueDynasties = [...new Set(records.map(emp => emp.Dynasty))].filter(Boolean);
        setDynasties(uniqueDynasties.sort());
        
        const dynastyCounts = records.reduce((acc, emperor) => {
          if (emperor.Dynasty) {
            acc[emperor.Dynasty] = (acc[emperor.Dynasty] || 0) + 1;
          }
          return acc;
        }, {});

        const stats = Object.entries(dynastyCounts)
          .map(([name, count]) => ({
            name,
            count,
          }))
          .filter(stat => stat.name);

        setDynastyStats(stats.sort((a, b) => b.count - a.count));
      });
  }, []);

  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const startGame = () => {
    handleMenuClose();
    const randomEmperor = emperors[Math.floor(Math.random() * emperors.length)];
    const gameType = Math.random() > 0.5 ? 'dynasty' : 'death';
    
    setCurrentGame({
      emperor: randomEmperor,
      type: gameType,
      options: gameType === 'dynasty' 
        ? [...new Set(emperors.map(e => e.Dynasty))].filter(Boolean).sort(() => Math.random() - 0.5).slice(0, 4)
        : DEATH_CAUSES.sort(() => Math.random() - 0.5).slice(0, 4)
    });
    setGameAnswer('');
    setGameResult(null);
    setGameDialogOpen(true);
  };

  const handleGameAnswer = () => {
    const correct = currentGame.type === 'dynasty' 
      ? gameAnswer === currentGame.emperor.Dynasty
      : gameAnswer === currentGame.emperor.Cause;

    setGameResult(correct);
    setScore(prev => prev + (correct ? 1 : 0));
  };

  const handleNextGame = () => {
    setGameResult(null);
    startGame();
  };

  const calculateStats = () => {
    if (!emperors.length) return { total: 0, avgReign: 0, violent: 0 };

    const violent = emperors.filter(
      (e) => e.Cause === 'Assassination' || e.Cause === 'Execution' || e.Cause === 'Died in Battle'
    ).length;

    return {
      total: emperors.length,
      violent: Math.round((violent / emperors.length) * 100),
    };
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDynasty('');
    setSelectedCause('');
    setTimeRange({ start: '', end: '' });
  };

  const filteredEmperors = emperors.filter(emperor => {
    const matchesSearch = searchTerm === '' || 
      emperor.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emperor.Dynasty.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDynasty = !selectedDynasty || emperor.Dynasty === selectedDynasty;
    const matchesCause = !selectedCause || emperor.Cause === selectedCause;

    let matchesTimeRange = true;
    if (timeRange.start || timeRange.end) {
      const emperorYear = new Date(emperor.Birth).getFullYear();
      if (timeRange.start && emperorYear < parseInt(timeRange.start)) {
        matchesTimeRange = false;
      }
      if (timeRange.end && emperorYear > parseInt(timeRange.end)) {
        matchesTimeRange = false;
      }
    }

    return matchesSearch && matchesDynasty && matchesCause && matchesTimeRange;
  });

  const stats = calculateStats();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ background: 'linear-gradient(45deg, #b71c1c 30%, #7f0000 90%)' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleMenuOpen}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <LocalLibraryIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            ROMAN EMPERORS DATABASE
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              position: 'relative',
              borderRadius: 1,
              backgroundColor: alpha('#fff', 0.15),
              '&:hover': { backgroundColor: alpha('#fff', 0.25) },
              width: '200px'
            }}>
              <Box sx={{ padding: '0 16px', height: '100%', position: 'absolute', display: 'flex', alignItems: 'center' }}>
                <SearchIcon />
              </Box>
              <InputBase
                placeholder="Search emperors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{
                  color: 'inherit',
                  padding: '8px 8px 8px 48px',
                  width: '100%'
                }}
              />
            </Box>

            <FormControl variant="outlined" size="small" sx={{ minWidth: 120, backgroundColor: alpha('#fff', 0.15) }}>
              <InputLabel>Dynasty</InputLabel>
              <Select
                value={selectedDynasty}
                onChange={(e) => setSelectedDynasty(e.target.value)}
                label="Dynasty"
              >
                <MenuItem value="">
                  <em>All</em>
                </MenuItem>
                {dynasties.map((dynasty) => (
                  <MenuItem key={dynasty} value={dynasty}>
                    {dynasty}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl variant="outlined" size="small" sx={{ minWidth: 120, backgroundColor: alpha('#fff', 0.15) }}>
              <InputLabel>Cause of Death</InputLabel>
              <Select
                value={selectedCause}
                onChange={(e) => setSelectedCause(e.target.value)}
                label="Cause of Death"
              >
                <MenuItem value="">
                  <em>All</em>
                </MenuItem>
                {DEATH_CAUSES.map((cause) => (
                  <MenuItem key={cause} value={cause}>
                    {cause}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                label="From Year"
                type="number"
                value={timeRange.start}
                onChange={(e) => setTimeRange(prev => ({ ...prev, start: e.target.value }))}
                sx={{ width: 100, backgroundColor: alpha('#fff', 0.15) }}
              />
              <TextField
                size="small"
                label="To Year"
                type="number"
                value={timeRange.end}
                onChange={(e) => setTimeRange(prev => ({ ...prev, end: e.target.value }))}
                sx={{ width: 100, backgroundColor: alpha('#fff', 0.15) }}
              />
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            backgroundColor: theme.palette.background.paper,
            boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
          }
        }}
      >
        <MenuItem onClick={startGame} sx={{ 
          py: 1.5,
          '&:hover': { 
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
          }
        }}>
          <SportsEsportsIcon sx={{ mr: 1 }} />
          Play Guessing Game
        </MenuItem>
      </Menu>

      <Dialog 
        open={gameDialogOpen} 
        onClose={() => setGameDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SportsEsportsIcon color="secondary" />
            Emperor Guessing Game
            <Typography variant="subtitle1" sx={{ ml: 'auto' }}>
              Score: {score}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {currentGame && (
            <>
              <Typography variant="h6" gutterBottom>
                Emperor: {currentGame.emperor.Name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Question: What was this emperor's {currentGame.type === 'dynasty' ? 'dynasty' : 'cause of death'}?
              </Typography>
              
              <RadioGroup
                value={gameAnswer}
                onChange={(e) => setGameAnswer(e.target.value)}
              >
                {currentGame.options.map((option) => (
                  <FormControlLabel
                    key={option}
                    value={option}
                    control={<Radio />}
                    label={option}
                    disabled={gameResult !== null}
                  />
                ))}
              </RadioGroup>

              {gameResult !== null && (
                <Alert 
                  severity={gameResult ? "success" : "error"}
                  sx={{ mt: 2 }}
                >
                  {gameResult ? "Correct!" : "Wrong! The correct answer was: " + 
                    (currentGame.type === 'dynasty' ? currentGame.emperor.Dynasty : currentGame.emperor.Cause)}
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          {gameResult === null ? (
            <Button onClick={handleGameAnswer} disabled={!gameAnswer}>
              Submit Answer
            </Button>
          ) : (
            <>
              <Button onClick={() => setGameDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={handleNextGame} variant="contained" color="primary">
                Next Question
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Box sx={{ marginTop: '80px' }}>
        <Container maxWidth="lg">
          <Box sx={{ my: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent sx={{ position: 'relative' }}>
                    <TimelineIcon sx={{ position: 'absolute', right: 16, top: 16, fontSize: 40, opacity: 0.3 }} />
                    <Typography variant="h5" gutterBottom color="secondary">
                      Imperial Statistics
                    </Typography>
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="h3" color="primary">
                        {stats.total}
                      </Typography>
                      <Typography variant="subtitle1" color="text.secondary">
                        Total Emperors
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="h4" color="error">
                        {stats.violent}%
                      </Typography>
                      <Typography variant="subtitle1" color="text.secondary">
                        Died Violently
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h5" gutterBottom color="secondary">
                      Emperors by Dynasty
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dynastyStats}>
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e1e1e' }}
                          cursor={{ fill: 'rgba(183, 28, 28, 0.1)' }}
                        />
                        <Bar dataKey="count" fill="#b71c1c" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h5" gutterBottom color="secondary">
                      Imperial Registry
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Showing {filteredEmperors.length} of {emperors.length} emperors
                      </Typography>
                    </Box>
                    <TableContainer component={Paper} sx={{ mt: 2 }}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Emperor</TableCell>
                            <TableCell>Birth</TableCell>
                            <TableCell>Death</TableCell>
                            <TableCell>Cause of Death</TableCell>
                            <TableCell>Dynasty</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredEmperors
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((emperor, index) => (
                            <TableRow key={index} hover>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Avatar sx={{ bgcolor: '#b71c1c' }}>
                                    {emperor.Name?.charAt(0) || '?'}
                                  </Avatar>
                                  {emperor.Name}
                                </Box>
                              </TableCell>
                              <TableCell>{formatDate(emperor.Birth)}</TableCell>
                              <TableCell>{formatDate(emperor.Death)}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={emperor.Cause || 'Unknown'}
                                  color={emperor.Cause === 'Natural Causes' ? 'success' : 
                                        emperor.Cause === 'Assassination' ? 'error' : 
                                        emperor.Cause === 'Died in Battle' ? 'warning' : 
                                        'default'}
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={emperor.Dynasty}
                                  color="primary"
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={filteredEmperors.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                      />
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
