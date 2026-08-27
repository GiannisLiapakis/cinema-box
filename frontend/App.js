import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { api } from './api';

const COLORS = {
  bg: '#070b14',
  card: '#101827',
  card2: '#172235',
  text: '#f7f8fb',
  muted: '#9aa7bb',
  primary: '#635bff',
  pink: '#ef476f',
  green: '#2dd4bf',
  border: '#26344a',
  danger: '#ff5c5c'
};

function Button({ title, onPress, secondary = false, danger = false, disabled = false }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        secondary && styles.buttonSecondary,
        danger && styles.buttonDanger,
        disabled && { opacity: 0.5 }
      ]}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

function Field({ label, value, onChangeText, placeholder, secureTextEntry = false, keyboardType }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#71809a"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        style={styles.input}
      />
    </View>
  );
}

function Logo() {
  return (
    <View style={styles.logoRow}>
      <View style={styles.logoIcon}><Text style={{ fontSize: 22 }}>🎬</Text></View>
      <Text style={styles.logo}>CINEMA BOX</Text>
    </View>
  );
}

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const data = mode === 'login'
        ? await api('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
          })
        : await api('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, name, email, password })
          });

      await AsyncStorage.setItem('cinema_token', data.token);
      await AsyncStorage.setItem('cinema_user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (e) {
      Alert.alert('Cinema Box', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.authWrap}>
        <Logo />
        <Text style={styles.heroTitle}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</Text>
        <Text style={styles.subtitle}>
          {mode === 'login' ? 'Sign in to book your next movie.' : 'Register to start booking cinema seats.'}
        </Text>

        <View style={styles.authCard}>
          {mode === 'register' && (
            <>
              <Field label="Full name" value={name} onChangeText={setName} placeholder="Your name" />
              <Field label="Email" value={email} onChangeText={setEmail} placeholder="name@example.com" keyboardType="email-address" />
            </>
          )}
          <Field label="Username" value={username} onChangeText={setUsername} placeholder="Username" />
          <Field label="Password" value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
          <Button title={loading ? 'Please wait...' : mode === 'login' ? 'LOGIN' : 'REGISTER'} onPress={submit} disabled={loading} />

          <Pressable onPress={() => setMode(mode === 'login' ? 'register' : 'login')} style={{ marginTop: 18 }}>
            <Text style={styles.link}>
              {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Login'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.demoBox}>
          <Text style={styles.demoTitle}>Demo accounts</Text>
          <Text style={styles.muted}>Admin: giannis / liapakis</Text>
          <Text style={styles.muted}>User: gian / 12345</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ user, onLogout }) {
  return (
    <View style={styles.header}>
      <Logo />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={styles.userBadge}>{user?.username}</Text>
        <Pressable onPress={onLogout}><Text style={styles.logout}>Logout</Text></Pressable>
      </View>
    </View>
  );
}

function UserHome({ user, onLogout }) {
  const [cinemas, setCinemas] = useState([]);
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCinema, setSelectedCinema] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [occupied, setOccupied] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [tab, setTab] = useState('movies');
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [c, m, r] = await Promise.all([
        api('/cinemas'),
        api('/movies'),
        api('/reservations/user')
      ]);
      setCinemas(c);
      setMovies(m);
      setReservations(r);
    } catch (e) {
      Alert.alert('Cinema Box', e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function chooseMovie(movie) {
    setSelectedMovie(movie);
    setSelectedCinema(cinemas.find(c => c.cinema_id === movie.cinema_id));
    setSelectedSeats([]);
    try {
      const data = await api(`/movies/${movie.movie_id}/showtimes`);
      setShowtimes(data);
    } catch (e) {
      Alert.alert('Cinema Box', e.message);
    }
  }

  async function chooseShowtime(showtime) {
    try {
      const data = await api(`/reservations/seats/${showtime.showtime_id}`);
      setOccupied(data.occupied || []);
      setSelectedSeats([]);
    } catch (e) {
      Alert.alert('Cinema Box', e.message);
    }
  }

  function toggleSeat(seat) {
    if (occupied.includes(seat)) return;
    setSelectedSeats(prev => prev.includes(seat) ? prev.filter(x => x !== seat) : [...prev, seat]);
  }

  async function reserve(showtime) {
    if (!selectedSeats.length) {
      Alert.alert('Cinema Box', 'Select at least one seat.');
      return;
    }
    try {
      await api('/reservations', {
        method: 'POST',
        body: JSON.stringify({
          movie_id: selectedMovie.movie_id,
          cinema_id: selectedCinema.cinema_id,
          showtime_id: showtime.showtime_id,
          show_date: showtime.show_date,
          show_time: showtime.show_time,
          seat_numbers: selectedSeats
        })
      });
      Alert.alert('Cinema Box', 'Reservation created successfully.');
      setSelectedSeats([]);
      await load();
      await chooseShowtime(showtime);
    } catch (e) {
      Alert.alert('Cinema Box', e.message);
    }
  }

  async function cancelReservation(id) {
    try {
      await api(`/reservations/${id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      Alert.alert('Cinema Box', e.message);
    }
  }

  const filteredMovies = useMemo(() => {
    const q = search.toLowerCase();
    return movies.filter(m =>
      m.title.toLowerCase().includes(q) ||
      m.cinema_name.toLowerCase().includes(q)
    );
  }, [movies, search]);

  const seats = Array.from({ length: 60 }, (_, i) => {
    const row = String.fromCharCode(65 + Math.floor(i / 10));
    const number = (i % 10) + 1;
    return `${row}${number}`;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <Header user={user} onLogout={onLogout} />
      <View style={styles.tabBar}>
        <Pressable onPress={() => setTab('movies')} style={[styles.tab, tab === 'movies' && styles.tabActive]}>
          <Text style={styles.tabText}>🎬 Movies</Text>
        </Pressable>
        <Pressable onPress={() => setTab('reservations')} style={[styles.tab, tab === 'reservations' && styles.tabActive]}>
          <Text style={styles.tabText}>🎟 My Reservations</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {tab === 'movies' ? (
          <>
            <Text style={styles.pageTitle}>Choose your movie</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search movies or cinemas..."
              placeholderTextColor="#71809a"
              style={styles.search}
            />

            <Text style={styles.sectionTitle}>Cinemas</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              <Pressable onPress={() => setSelectedCinema(null)} style={[styles.chip, !selectedCinema && styles.chipActive]}>
                <Text style={styles.chipText}>All</Text>
              </Pressable>
              {cinemas.map(c => (
                <Pressable key={c.cinema_id} onPress={() => setSelectedCinema(c)} style={[styles.chip, selectedCinema?.cinema_id === c.cinema_id && styles.chipActive]}>
                  <Text style={styles.chipText}>{c.name}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {loading && <ActivityIndicator size="large" color={COLORS.primary} />}

            <View style={styles.movieGrid}>
              {filteredMovies
                .filter(m => !selectedCinema || m.cinema_id === selectedCinema.cinema_id)
                .map(movie => (
                  <Pressable key={movie.movie_id} onPress={() => chooseMovie(movie)} style={styles.movieCard}>
                    <View style={styles.poster}>
                      <Text style={{ fontSize: 42 }}>🎞️</Text>
                    </View>
                    <Text style={styles.movieTitle}>{movie.title}</Text>
                    <Text style={styles.muted}>{movie.cinema_name}</Text>
                    <Text style={styles.movieMeta}>{movie.duration} min · ⭐ {movie.rating}</Text>
                    <Text style={styles.muted} numberOfLines={2}>{movie.description}</Text>
                  </Pressable>
                ))}
            </View>

            {selectedMovie && (
              <View style={styles.bookingCard}>
                <Text style={styles.sectionTitle}>Book: {selectedMovie.title}</Text>
                <Text style={styles.muted}>Choose a showtime</Text>

                <View style={styles.showtimeRow}>
                  {showtimes.map(s => (
                    <Pressable key={s.showtime_id} onPress={() => chooseShowtime(s)} style={styles.showtime}>
                      <Text style={styles.showtimeText}>{String(s.show_time).slice(0, 5)}</Text>
                      <Text style={styles.muted}>{String(s.show_date).slice(0, 10)}</Text>
                    </Pressable>
                  ))}
                </View>

                {showtimes.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Seats</Text>
                    <View style={styles.screen}><Text style={styles.screenText}>SCREEN</Text></View>
                    <View style={styles.seatGrid}>
                      {seats.map(seat => {
                        const isOccupied = occupied.includes(seat);
                        const isSelected = selectedSeats.includes(seat);
                        return (
                          <Pressable
                            key={seat}
                            onPress={() => toggleSeat(seat)}
                            style={[
                              styles.seat,
                              isOccupied && styles.seatOccupied,
                              isSelected && styles.seatSelected
                            ]}
                          >
                            <Text style={styles.seatText}>{seat}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <Text style={styles.muted}>Selected: {selectedSeats.length ? selectedSeats.join(', ') : 'none'}</Text>

                    {showtimes.map(s => (
                      <Button key={`book-${s.showtime_id}`} title={`Book selected seats · ${String(s.show_time).slice(0,5)}`} onPress={() => reserve(s)} disabled={!selectedSeats.length} />
                    ))}
                  </>
                )}
              </View>
            )}
          </>
        ) : (
          <>
            <Text style={styles.pageTitle}>My Reservations</Text>
            {reservations.length === 0 && <Text style={styles.muted}>No reservations yet.</Text>}
            {reservations.map(r => (
              <View key={r.reservation_id} style={styles.reservationCard}>
                <Text style={styles.movieTitle}>{r.movie_title}</Text>
                <Text style={styles.muted}>{r.cinema_name}</Text>
                <Text style={styles.reservationInfo}>
                  {String(r.show_date).slice(0, 10)} · {String(r.show_time).slice(0, 5)}
                </Text>
                <Text style={styles.reservationInfo}>Seats: {r.seat_numbers}</Text>
                <Text style={[styles.status, r.status === 'confirmed' ? styles.confirmed : styles.cancelled]}>
                  {r.status}
                </Text>
                {r.status === 'confirmed' && (
                  <Button title="Cancel reservation" danger onPress={() => cancelReservation(r.reservation_id)} />
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

function AdminHome({ user, onLogout }) {
  const [tab, setTab] = useState('movies');
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [editingMovie, setEditingMovie] = useState(null);
  const [movieForm, setMovieForm] = useState({
    title: '', cinema_id: '', duration: '120', rating: '8.0', description: '', poster_url: ''
  });
  const [cinemaForm, setCinemaForm] = useState({
    name: '', location: '', description: '', total_seats: '60'
  });
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [m, c, r] = await Promise.all([
        api('/movies'),
        api('/cinemas'),
        api('/reservations/all')
      ]);
      setMovies(m);
      setCinemas(c);
      setReservations(r);
    } catch (e) {
      Alert.alert('Admin', e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function resetMovie() {
    setEditingMovie(null);
    setMovieForm({ title: '', cinema_id: cinemas[0]?.cinema_id ? String(cinemas[0].cinema_id) : '', duration: '120', rating: '8.0', description: '', poster_url: '' });
  }

  function editMovie(movie) {
    setEditingMovie(movie);
    setMovieForm({
      title: movie.title,
      cinema_id: String(movie.cinema_id),
      duration: String(movie.duration),
      rating: String(movie.rating),
      description: movie.description || '',
      poster_url: movie.poster_url || ''
    });
    setTab('movie-form');
  }

  async function saveMovie() {
    try {
      if (!movieForm.title || !movieForm.cinema_id || !movieForm.duration) {
        Alert.alert('Admin', 'Title, cinema and duration are required.');
        return;
      }
      const payload = {
        ...movieForm,
        cinema_id: Number(movieForm.cinema_id),
        duration: Number(movieForm.duration),
        rating: Number(movieForm.rating)
      };

      if (editingMovie) {
        await api(`/movies/${editingMovie.movie_id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await api('/movies', { method: 'POST', body: JSON.stringify(payload) });
      }

      Alert.alert('Admin', editingMovie ? 'Movie updated.' : 'Movie added.');
      resetMovie();
      await load();
      setTab('movies');
    } catch (e) {
      Alert.alert('Admin', e.message);
    }
  }

  async function deleteMovie(movie) {
    if (Platform.OS === 'web') {
      if (!window.confirm(`Delete "${movie.title}"?`)) return;
    }
    try {
      await api(`/movies/${movie.movie_id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      Alert.alert('Admin', e.message);
    }
  }

  async function addCinema() {
    try {
      if (!cinemaForm.name || !cinemaForm.location) {
        Alert.alert('Admin', 'Name and location are required.');
        return;
      }
      await api('/cinemas', {
        method: 'POST',
        body: JSON.stringify({ ...cinemaForm, total_seats: Number(cinemaForm.total_seats) })
      });
      setCinemaForm({ name: '', location: '', description: '', total_seats: '60' });
      await load();
      Alert.alert('Admin', 'Cinema added.');
    } catch (e) {
      Alert.alert('Admin', e.message);
    }
  }

  async function deleteCinema(cinema) {
    if (Platform.OS === 'web') {
      if (!window.confirm(`Delete "${cinema.name}"? This also removes its movies.`)) return;
    }
    try {
      await api(`/cinemas/${cinema.cinema_id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      Alert.alert('Admin', e.message);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header user={user} onLogout={onLogout} />
      <View style={styles.tabBar}>
        {[
          ['movies', '🎬 Movies'],
          ['movie-form', '➕ Add Movie'],
          ['cinemas', '🏢 Cinemas'],
          ['reservations', '🎟 Reservations']
        ].map(([key, label]) => (
          <Pressable key={key} onPress={() => { if (key === 'movie-form') resetMovie(); setTab(key); }} style={[styles.tab, tab === key && styles.tabActive]}>
            <Text style={styles.tabText}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.adminTag}>CINEMA BOX ADMIN</Text>
        <Text style={styles.pageTitle}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Welcome {user.name || user.username}</Text>

        {loading && <ActivityIndicator size="large" color={COLORS.primary} />}

        {tab === 'movies' && (
          <>
            <View style={styles.adminHeaderRow}>
              <Text style={styles.sectionTitle}>Movies</Text>
              <Button title="+ Add Movie" onPress={() => { resetMovie(); setTab('movie-form'); }} />
            </View>
            {movies.map(movie => (
              <View key={movie.movie_id} style={styles.adminCard}>
                <View style={styles.posterSmall}><Text style={{ fontSize: 28 }}>🎬</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.movieTitle}>{movie.title}</Text>
                  <Text style={styles.muted}>{movie.cinema_name}</Text>
                  <Text style={styles.movieMeta}>{movie.duration} min · ⭐ {movie.rating}</Text>
                </View>
                <View style={{ gap: 8 }}>
                  <Button title="Edit" secondary onPress={() => editMovie(movie)} />
                  <Button title="Delete" danger onPress={() => deleteMovie(movie)} />
                </View>
              </View>
            ))}
          </>
        )}

        {tab === 'movie-form' && (
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>{editingMovie ? 'Edit Movie' : 'Add Movie'}</Text>
            <Field label="Title" value={movieForm.title} onChangeText={v => setMovieForm({ ...movieForm, title: v })} placeholder="Movie title" />
            <Text style={styles.label}>Cinema</Text>
            <ScrollView horizontal style={{ marginBottom: 14 }}>
              {cinemas.map(c => (
                <Pressable key={c.cinema_id} onPress={() => setMovieForm({ ...movieForm, cinema_id: String(c.cinema_id) })} style={[styles.chip, movieForm.cinema_id === String(c.cinema_id) && styles.chipActive]}>
                  <Text style={styles.chipText}>{c.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Field label="Duration (minutes)" value={movieForm.duration} onChangeText={v => setMovieForm({ ...movieForm, duration: v })} placeholder="120" keyboardType="numeric" />
            <Field label="Rating" value={movieForm.rating} onChangeText={v => setMovieForm({ ...movieForm, rating: v })} placeholder="8.0" keyboardType="numeric" />
            <Field label="Description" value={movieForm.description} onChangeText={v => setMovieForm({ ...movieForm, description: v })} placeholder="Description" />
            <Field label="Poster URL (optional)" value={movieForm.poster_url} onChangeText={v => setMovieForm({ ...movieForm, poster_url: v })} placeholder="https://..." />
            <Button title={editingMovie ? 'SAVE CHANGES' : 'ADD MOVIE'} onPress={saveMovie} />
            {editingMovie && <Button title="Cancel" secondary onPress={resetMovie} />}
          </View>
        )}

        {tab === 'cinemas' && (
          <>
            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Add Cinema</Text>
              <Field label="Name" value={cinemaForm.name} onChangeText={v => setCinemaForm({ ...cinemaForm, name: v })} placeholder="Cinema name" />
              <Field label="Location" value={cinemaForm.location} onChangeText={v => setCinemaForm({ ...cinemaForm, location: v })} placeholder="City / area" />
              <Field label="Description" value={cinemaForm.description} onChangeText={v => setCinemaForm({ ...cinemaForm, description: v })} placeholder="Description" />
              <Field label="Total seats" value={cinemaForm.total_seats} onChangeText={v => setCinemaForm({ ...cinemaForm, total_seats: v })} placeholder="60" keyboardType="numeric" />
              <Button title="ADD CINEMA" onPress={addCinema} />
            </View>

            {cinemas.map(c => (
              <View key={c.cinema_id} style={styles.adminCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.movieTitle}>{c.name}</Text>
                  <Text style={styles.muted}>{c.location} · {c.total_seats} seats</Text>
                </View>
                <Button title="Delete" danger onPress={() => deleteCinema(c)} />
              </View>
            ))}
          </>
        )}

        {tab === 'reservations' && (
          <>
            <Text style={styles.sectionTitle}>All Reservations</Text>
            {reservations.length === 0 && <Text style={styles.muted}>No reservations yet.</Text>}
            {reservations.map(r => (
              <View key={r.reservation_id} style={styles.reservationCard}>
                <Text style={styles.movieTitle}>{r.movie_title}</Text>
                <Text style={styles.muted}>User: {r.username}</Text>
                <Text style={styles.muted}>{r.cinema_name}</Text>
                <Text style={styles.reservationInfo}>{String(r.show_date).slice(0,10)} · {String(r.show_time).slice(0,5)}</Text>
                <Text style={styles.reservationInfo}>Seats: {r.seat_numbers}</Text>
                <Text style={styles.status}>{r.status}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('cinema_user');
        const token = await AsyncStorage.getItem('cinema_token');
        if (saved && token) setUser(JSON.parse(saved));
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  async function logout() {
    await AsyncStorage.multiRemove(['cinema_token', 'cinema_user']);
    setUser(null);
  }

  if (checking) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!user) return <AuthScreen onLogin={setUser} />;

  return user.role === 'admin'
    ? <AdminHome user={user} onLogout={logout} />
    : <UserHome user={user} onLogout={logout} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  authWrap: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 28, paddingTop: 70 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  logo: { color: COLORS.text, fontWeight: '900', fontSize: 18, letterSpacing: 1.4 },
  heroTitle: { color: COLORS.text, fontSize: 38, fontWeight: '900', marginTop: 38 },
  subtitle: { color: COLORS.muted, fontSize: 16, marginTop: 8, marginBottom: 24 },
  authCard: { backgroundColor: COLORS.card, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  label: { color: '#c8d1df', fontWeight: '700', marginBottom: 7 },
  input: { backgroundColor: '#0b1220', color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 13, fontSize: 16 },
  button: { backgroundColor: COLORS.primary, paddingVertical: 13, paddingHorizontal: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  buttonSecondary: { backgroundColor: COLORS.card2 },
  buttonDanger: { backgroundColor: COLORS.danger },
  buttonText: { color: '#fff', fontWeight: '900' },
  link: { color: '#8d88ff', textAlign: 'center', fontWeight: '800' },
  demoBox: { marginTop: 20, backgroundColor: '#0b1220', padding: 18, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  demoTitle: { color: COLORS.text, fontWeight: '900', marginBottom: 5 },
  muted: { color: COLORS.muted, marginTop: 4 },
  header: { minHeight: 72, paddingHorizontal: 24, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  userBadge: { color: COLORS.text, backgroundColor: COLORS.card2, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9 },
  logout: { color: COLORS.pink, fontWeight: '900' },
  tabBar: { flexDirection: 'row', gap: 6, paddingHorizontal: 18, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border, overflow: 'scroll' },
  tab: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.text, fontWeight: '800' },
  container: { width: '100%', maxWidth: 1100, alignSelf: 'center', padding: 24, paddingBottom: 80 },
  pageTitle: { color: COLORS.text, fontSize: 32, fontWeight: '900', marginBottom: 6 },
  sectionTitle: { color: COLORS.text, fontSize: 21, fontWeight: '900', marginTop: 14, marginBottom: 12 },
  search: { backgroundColor: COLORS.card, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14, marginVertical: 16 },
  chip: { backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, marginRight: 8 },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.text, fontWeight: '800' },
  movieGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  movieCard: { width: Platform.OS === 'web' ? 250 : '100%', backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, padding: 14 },
  poster: { height: 230, backgroundColor: '#151f31', borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  posterSmall: { width: 70, height: 90, backgroundColor: '#151f31', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  movieTitle: { color: COLORS.text, fontSize: 18, fontWeight: '900' },
  movieMeta: { color: '#d2d9e4', marginTop: 8 },
  bookingCard: { marginTop: 28, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, padding: 20 },
  showtimeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  showtime: { backgroundColor: COLORS.card2, borderRadius: 12, padding: 12, minWidth: 95 },
  showtimeText: { color: COLORS.text, fontSize: 17, fontWeight: '900' },
  screen: { height: 32, backgroundColor: '#d7dbe3', borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginVertical: 15 },
  screenText: { color: '#1a2030', fontWeight: '900', fontSize: 11 },
  seatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, maxWidth: 650, alignSelf: 'center', justifyContent: 'center', marginBottom: 14 },
  seat: { width: 50, height: 38, borderRadius: 8, backgroundColor: '#26344a', alignItems: 'center', justifyContent: 'center' },
  seatSelected: { backgroundColor: COLORS.green },
  seatOccupied: { backgroundColor: '#4a2630' },
  seatText: { color: COLORS.text, fontSize: 11, fontWeight: '800' },
  reservationCard: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 18, marginBottom: 12 },
  reservationInfo: { color: '#d2d9e4', marginTop: 6 },
  status: { color: COLORS.text, fontWeight: '900', marginTop: 10, textTransform: 'uppercase' },
  confirmed: { color: COLORS.green },
  cancelled: { color: COLORS.danger },
  adminTag: { color: '#8d88ff', fontWeight: '900', letterSpacing: 1 },
  adminHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  adminCard: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 15, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  formCard: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, padding: 20 },
});
