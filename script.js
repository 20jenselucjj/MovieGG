const genreSelect = document.getElementById('genre');
const discoverButton = document.getElementById('discover-button');
const checkmarkContainer = document.getElementById('checkmark-container');
const errorMessage = document.getElementById('error-message');
const movieResult = document.getElementById('movie-result');
const loadingSpinner = document.getElementById('loading-spinner');

const apiKey = '4097e111160ea3c27318e80b04263a31'; // TMDb API key
let displayedMovies = []; // Track movies that have already been displayed

// Load genres from data.json
const loadGenres = async () => {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error('Failed to load genres');
        }
        const data = await response.json();
        populateGenreSelect(data.genres);
    } catch (err) {
        console.error('Error loading genres:', err);
    }
};

// Populate the genre dropdown
const populateGenreSelect = (genres) => {
    genres.forEach((genre) => {
        const option = document.createElement('option');
        option.value = genre.id;
        option.textContent = genre.name;
        genreSelect.appendChild(option);
    });
};

// Fetch data with error handling
const fetchWithErrorHandling = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
    }
    return response.json();
};

// Event listener for the "Discover Movie" button
discoverButton.addEventListener('click', async () => {
    const selectedGenre = genreSelect.value;

    if (!selectedGenre) {
        errorMessage.textContent = 'Please select a genre first';
        errorMessage.classList.remove('hidden');
        return;
    }

    discoverButton.disabled = true;
    discoverButton.textContent = 'Searching...';
    errorMessage.classList.add('hidden');
    checkmarkContainer.classList.add('hidden');
    movieResult.innerHTML = '';
    loadingSpinner.classList.remove('hidden');

    try {
        const discoverData = await fetchWithErrorHandling(
            `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${selectedGenre}&vote_average.gte=6.5&include_adult=false`
        );

        if (discoverData.results.length === 0) {
            throw new Error('No movies found with a rating of 6.5/10 or higher.');
        }

        const availableMovies = discoverData.results.filter(
            (movie) => !displayedMovies.includes(movie.id)
        );

        if (availableMovies.length === 0) {
            throw new Error('No new movies found with a rating of 6.5/10 or higher.');
        }

        const randomIndex = Math.floor(Math.random() * availableMovies.length);
        const randomMovie = availableMovies[randomIndex];
        displayedMovies.push(randomMovie.id);

        const movieDetails = await fetchWithErrorHandling(
            `https://api.themoviedb.org/3/movie/${randomMovie.id}?api_key=${apiKey}`
        );

        const creditsData = await fetchWithErrorHandling(
            `https://api.themoviedb.org/3/movie/${randomMovie.id}/credits?api_key=${apiKey}`
        );

        const videosData = await fetchWithErrorHandling(
            `https://api.themoviedb.org/3/movie/${randomMovie.id}/videos?api_key=${apiKey}`
        );

        const director = creditsData.crew.find((person) => person.job === 'Director')?.name || 'Not available';
        const cast = creditsData.cast.slice(0, 5).map((actor) => actor.name).join(', ') || 'Not available';
        const trailer = videosData.results.find((video) => video.type === 'Trailer' && video.site === 'YouTube');

        movieResult.innerHTML = `
            <div class="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div class="md:flex">
                    <div class="md:w-1/2">
                        <img
                            src="${movieDetails.poster_path ? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}` : 'https://placehold.co/300x445'}"
                            alt="${movieDetails.title}"
                            class="w-full h-full object-cover"
                        />
                    </div>
                    <div class="p-6 md:w-1/2">
                        <h2 class="text-2xl font-bold mb-2 font-serif">${movieDetails.title}</h2>
                        <div class="flex items-center gap-2 text-sm text-gray-400 mb-4">
                            <span>${movieDetails.release_date}</span>
                            <span>•</span>
                            <span>${movieDetails.runtime} mins</span>
                            <span>•</span>
                            <span>${movieDetails.genres.map(genre => genre.name).join(', ')}</span>
                        </div>
                        <p class="text-gray-300 mb-4">${movieDetails.overview}</p>
                        <div class="space-y-2">
                            <p class="text-gray-400"><span class="font-semibold">Director:</span> ${director}</p>
                            <p class="text-gray-400"><span class="font-semibold">Cast:</span> ${cast}</p>
                            <div class="flex items-center gap-2">
                                <span class="text-yellow-500">★</span>
                                <span class="font-semibold">${movieDetails.vote_average.toFixed(1)}</span>
                                <span class="text-gray-400">/ 10</span>
                            </div>
                            ${trailer ? `
                                <div class="mt-4">
                                    <h3 class="text-lg font-semibold mb-2">Trailer</h3>
                                    <iframe
                                        width="100%"
                                        height="315"
                                        src="https://www.youtube.com/embed/${trailer.key}"
                                        frameborder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowfullscreen
                                    ></iframe>
                                </div>
                            ` : '<p class="text-gray-400">No trailer available.</p>'}
                        </div>
                    </div>
                </div>
            </div>
        `;

        checkmarkContainer.classList.remove('hidden');
    } catch (err) {
        errorMessage.textContent = `Error: ${err.message}`;
        errorMessage.classList.remove('hidden');
        movieResult.innerHTML = '<p class="text-xl">Select a genre to discover your next favorite movie</p>';
    } finally {
        loadingSpinner.classList.add('hidden');
        discoverButton.disabled = false;
        discoverButton.textContent = 'Discover Movie';
    }
});

// Load genres when the page loads
loadGenres();