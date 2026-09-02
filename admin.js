

// DOM Elements
const songForm = document.getElementById('songForm');
const songIdInput = document.getElementById('songId');
const titleInput = document.getElementById('title');
const artistInput = document.getElementById('artist');
const albumInput = document.getElementById('album');
const coverUrlInput = document.getElementById('cover_url');
const audioUrlInput = document.getElementById('audio_url');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const formTitle = document.getElementById('formTitle');
const adminSongsList = document.getElementById('adminSongsList');
const adminLoading = document.getElementById('adminLoading');

let isEditing = false;

// Initialize
async function init() {
    await fetchAdminSongs();
    
    songForm.addEventListener('submit', handleFormSubmit);
    cancelBtn.addEventListener('click', resetForm);
}

// Fetch Songs
async function fetchAdminSongs() {
    try {
        const { data, error } = await db
            .from('songs')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        adminLoading.style.display = 'none';
        renderAdminSongs(data);
    } catch (error) {
        console.error('Error fetching songs:', error);
        adminLoading.innerText = 'Failed to load songs.';
    }
}

// Render list
function renderAdminSongs(songs) {
    adminSongsList.innerHTML = '';
    
    if(songs.length === 0) {
        adminSongsList.innerHTML = '<p style="color: var(--text-secondary);">No songs found. Add one above.</p>';
        return;
    }

    songs.forEach(song => {
        const coverUrl = song.cover_url || 'https://via.placeholder.com/150/1e212b/ffffff?text=No+Cover';
        
        const item = document.createElement('div');
        item.className = 'admin-song-item';
        item.innerHTML = `
            <div class="admin-song-info">
                <img src="${coverUrl}" alt="cover">
                <div class="admin-song-details">
                    <h4>${song.title}</h4>
                    <p>${song.artist}</p>
                </div>
            </div>
            <div class="admin-song-actions">
                <button class="edit-btn" onclick="editSong('${song.id}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button class="delete-btn" onclick="deleteSong('${song.id}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        adminSongsList.appendChild(item);
    });
}

// Form Submit
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const songData = {
        title: titleInput.value.trim(),
        artist: artistInput.value.trim(),
        album: albumInput.value.trim() || null,
        cover_url: coverUrlInput.value.trim() || null,
        audio_url: audioUrlInput.value.trim()
    };
    
    submitBtn.disabled = true;
    submitBtn.innerText = isEditing ? 'Updating...' : 'Adding...';

    try {
        if (isEditing) {
            const { error } = await db
                .from('songs')
                .update(songData)
                .eq('id', songIdInput.value);
                
            if (error) throw error;
            alert('Song updated successfully!');
        } else {
            const { error } = await db
                .from('songs')
                .insert([songData]);
                
            if (error) throw error;
            alert('Song added successfully!');
        }
        
        resetForm();
        await fetchAdminSongs();
    } catch (error) {
        console.error('Error saving song:', error);
        alert('Failed to save song: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = isEditing ? 'Update Song' : 'Add Song';
    }
}

// Delete Song
async function deleteSong(id) {
    if (!confirm('Are you sure you want to delete this song?')) return;
    
    try {
        const { error } = await db
            .from('songs')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        
        fetchAdminSongs();
    } catch (error) {
        console.error('Error deleting song:', error);
        alert('Failed to delete song.');
    }
}

// Edit Song setup
async function editSong(id) {
    try {
        const { data, error } = await db
            .from('songs')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error) throw error;
        
        // Populate form
        isEditing = true;
        songIdInput.value = data.id;
        titleInput.value = data.title;
        artistInput.value = data.artist;
        albumInput.value = data.album || '';
        coverUrlInput.value = data.cover_url || '';
        audioUrlInput.value = data.audio_url;
        
        formTitle.innerText = 'Edit Song';
        submitBtn.innerText = 'Update Song';
        cancelBtn.style.display = 'block';
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Error fetching song details:', error);
    }
}

// Reset Form
function resetForm() {
    isEditing = false;
    songForm.reset();
    songIdInput.value = '';
    formTitle.innerText = 'Add New Song';
    submitBtn.innerText = 'Add Song';
    cancelBtn.style.display = 'none';
}

// Make functions available globally for inline onclick handlers
window.deleteSong = deleteSong;
window.editSong = editSong;

document.addEventListener('DOMContentLoaded', init);
