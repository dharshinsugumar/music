

// State
let songsList = [];
let currentSongIndex = -1;
let isPlaying = false;

// DOM Elements
const songsGrid = document.getElementById('songsGrid');
const loadingIndicator = document.getElementById('loadingIndicator');
const searchInput = document.getElementById('searchInput');

// Player Elements
const audioElement = document.getElementById('audioElement');
const playPauseBtn = document.getElementById('playPauseBtn');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const progressBar = document.getElementById('progressBar');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const volumeBar = document.getElementById('volumeBar');
const volumeIcon = document.getElementById('volumeIcon');

const playerCover = document.getElementById('playerCover');
const playerTitle = document.getElementById('playerTitle');
const playerArtist = document.getElementById('playerArtist');


// Initialize
async function init() {
    await fetchSongs();
    setupEventListeners();
}

// Fetch Songs
async function fetchSongs() {
    try {
        const { data, error } = await db
            .from('songs')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        songsList = data;
        loadingIndicator.style.display = 'none';
        renderSongs(songsList);
    } catch (error) {
        console.error('Error fetching songs:', error);
        loadingIndicator.innerText = 'Failed to load songs.';
    }
}

// Render Songs
function renderSongs(songs) {
    songsGrid.innerHTML = '';
    
    if(songs.length === 0) {
        songsGrid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1;">No songs found.</p>';
        return;
    }

    songs.forEach((song, index) => {
        // Use a default cover if none provided
        const coverUrl = song.cover_url || 'https://via.placeholder.com/300/1e212b/ffffff?text=No+Cover';
        const isCurrentlyPlaying = (currentSongIndex !== -1 && songsList[currentSongIndex].id === song.id && isPlaying);

        const card = document.createElement('div');
        card.className = `song-card ${isCurrentlyPlaying ? 'playing' : ''}`;
        
        // Find actual index in global songsList to keep playback order correct even when filtered
        const actualIndex = songsList.findIndex(s => s.id === song.id);

        card.innerHTML = `
            <div class="song-cover-wrapper">
                <img src="${coverUrl}" alt="${song.title}" loading="lazy">
                <div class="play-overlay">
                    <i class="fa-solid fa-play"></i>
                </div>
            </div>
            <div class="song-info">
                <h4>${song.title}</h4>
                <p>${song.artist} ${song.album ? '• ' + song.album : ''}</p>
            </div>
        `;

        card.addEventListener('click', () => {
            if (actualIndex === currentSongIndex) {
                togglePlay();
            } else {
                playSong(actualIndex);
            }
        });

        songsGrid.appendChild(card);
    });
}

// Player Logic
function playSong(index) {
    if (index < 0 || index >= songsList.length) return;
    
    currentSongIndex = index;
    const song = songsList[index];
    
    audioElement.src = song.audio_url;
    audioElement.play();
    isPlaying = true;
    
    updatePlayerUI();
    renderSongs(songsList); // Re-render to update playing state visual
}

function togglePlay() {
    if (currentSongIndex === -1) {
        if(songsList.length > 0) playSong(0);
        return;
    }
    
    if (isPlaying) {
        audioElement.pause();
    } else {
        audioElement.play();
    }
    isPlaying = !isPlaying;
    updatePlayerUI();
    
    // Re-render to update playing state indicator on cards
    const query = searchInput.value.toLowerCase();
    if(query) {
        handleSearch();
    } else {
        renderSongs(songsList);
    }
}

function nextSong() {
    let nextIndex = currentSongIndex + 1;
    if (nextIndex >= songsList.length) nextIndex = 0; // Loop back
    playSong(nextIndex);
}

function prevSong() {
    let prevIndex = currentSongIndex - 1;
    if (prevIndex < 0) prevIndex = songsList.length - 1; // Loop to end
    playSong(prevIndex);
}

function updatePlayerUI() {
    if (currentSongIndex === -1) return;
    const song = songsList[currentSongIndex];
    
    playerTitle.innerText = song.title;
    playerArtist.innerText = song.artist;
    playerCover.src = song.cover_url || 'https://via.placeholder.com/150/121212/121212';
    
    if (isPlaying) {
        playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    } else {
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
}

// Formatting time
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function handleSearch() {
    const query = searchInput.value.toLowerCase();
    const filteredSongs = songsList.filter(song => 
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        (song.album && song.album.toLowerCase().includes(query))
    );
    renderSongs(filteredSongs);
}

// Event Listeners
function setupEventListeners() {
    playPauseBtn.addEventListener('click', togglePlay);
    nextBtn.addEventListener('click', nextSong);
    prevBtn.addEventListener('click', prevSong);
    
    audioElement.addEventListener('timeupdate', () => {
        if (audioElement.duration) {
            const progressPercent = (audioElement.currentTime / audioElement.duration) * 100;
            progressBar.value = progressPercent;
            currentTimeEl.innerText = formatTime(audioElement.currentTime);
            
            // visually update range slider fill
            progressBar.style.background = `linear-gradient(to right, var(--accent-color) ${progressPercent}%, rgba(255, 255, 255, 0.2) ${progressPercent}%)`;
        }
    });
    
    audioElement.addEventListener('loadedmetadata', () => {
        totalTimeEl.innerText = formatTime(audioElement.duration);
    });
    
    audioElement.addEventListener('ended', nextSong);
    
    progressBar.addEventListener('input', (e) => {
        const seekTime = (e.target.value / 100) * audioElement.duration;
        audioElement.currentTime = seekTime;
    });
    
    volumeBar.addEventListener('input', (e) => {
        const volume = e.target.value / 100;
        audioElement.volume = volume;
        
        if (volume === 0) {
            volumeIcon.className = 'fa-solid fa-volume-xmark';
        } else if (volume < 0.5) {
            volumeIcon.className = 'fa-solid fa-volume-low';
        } else {
            volumeIcon.className = 'fa-solid fa-volume-high';
        }
    });

    searchInput.addEventListener('input', handleSearch);
}

// Boot
document.addEventListener('DOMContentLoaded', init);
