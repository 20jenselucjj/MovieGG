const genreSelect = document.getElementById("genre");
const discoverButton = document.getElementById("discover-button");
const checkmarkContainer = document.getElementById("checkmark-container");
const errorMessage = document.getElementById("error-message");
const movieResult = document.getElementById("movie-result");

const apiKey = "4097e111160ea3c27318e80b04263a31"; // TMDb API key
let displayedMovies = []; // Track movies that have already been displayed

// Function to adjust the image size dynamically
const adjustImageSize = (img) => {
  const container = img.parentElement;
  const containerAspectRatio = 16 / 9;
  const imgAspectRatio = img.naturalWidth / img.naturalHeight;

  if (imgAspectRatio > containerAspectRatio) {
    // Image is wider than the container
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectPosition = "center center"; // Center the image
  } else {
    // Image is taller than the container
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectPosition = "center center"; // Center the image
  }
};

// Load genres from data.json
const loadGenres = async () => {
  try {
    const response = await fetch("data.json");
    if (!response.ok) {
      throw new Error("Failed to load genres");
    }
    const data = await response.json();
    populateGenreSelect(data.genres);
  } catch (err) {
    console.error("Error loading genres:", err);
  }
};

// Populate the genre dropdown
const populateGenreSelect = (genres) => {
  genres.forEach((genre) => {
    const option = document.createElement("option");
    option.value = genre.id;
    option.textContent = genre.name;
    genreSelect.appendChild(option);
  });

  // Add the "Japanese Anime" option manually
  const japaneseAnimeOption = document.createElement("option");
  japaneseAnimeOption.value = "16-ja";
  japaneseAnimeOption.textContent = "Japanese Anime";
  genreSelect.appendChild(japaneseAnimeOption);
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
discoverButton.addEventListener("click", async () => {
  const selectedGenre = genreSelect.value;

  if (!selectedGenre) {
    errorMessage.textContent = "Please select a genre first";
    errorMessage.classList.remove("hidden");
    return;
  }

  discoverButton.disabled = true;
  discoverButton.textContent = "Searching...";
  errorMessage.classList.add("hidden");
  checkmarkContainer.classList.add("hidden");
  movieResult.innerHTML = "";

  try {
    let apiUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&vote_average.gte=6.5&include_adult=false`;

    // Add genre and language filter for Japanese Anime
    if (selectedGenre === "16-ja") {
      apiUrl += "&with_genres=16&with_original_language=ja"; // Filter for Japanese anime movies
      apiUrl += "&with_keywords=210024|287501"; // Add anime-related keywords
    } else {
      apiUrl += `&with_genres=${selectedGenre}`; // Filter for other genres
    }

    const discoverData = await fetchWithErrorHandling(apiUrl);

    if (discoverData.results.length === 0) {
      throw new Error("No movies found with a rating of 6.5/10 or higher.");
    }

    const availableMovies = discoverData.results.filter(
      (movie) => !displayedMovies.includes(movie.id)
    );

    if (availableMovies.length === 0) {
      throw new Error("No new movies found with a rating of 6.5/10 or higher.");
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

    const director =
      creditsData.crew.find((person) => person.job === "Director")?.name ||
      "Not available";
    const cast =
      creditsData.cast
        .slice(0, 5)
        .map((actor) => actor.name)
        .join(", ") || "Not available";
    const trailer = videosData.results.find(
      (video) => video.type === "Trailer" && video.site === "YouTube"
    );

    // Display the movie details
    movieResult.innerHTML = `
      <div class="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div class="flex flex-col">
          <!-- Movie Image with Trailer Hint -->
          <div class="movie-image-container">
            <img
              src="${
                movieDetails.poster_path
                  ? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`
                  : "https://placehold.co/400x600"
              }"
              alt="${movieDetails.title}"
              class="w-full h-full object-cover"
            />
            <!-- Play Button -->
            <button class="play-button">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                id="Play"
                class="icon"
              >
                <path
                  d="M12 39c-.549 0-1.095-.15-1.578-.447A3.008 3.008 0 0 1 9 36V12c0-1.041.54-2.007 1.422-2.553a3.014 3.014 0 0 1 2.919-.132l24 12a3.003 3.003 0 0 1 0 5.37l-24 12c-.42.21-.885.315-1.341.315z"
                  fill="#ffffff"
                  class="color000000 svgShape"
                ></path>
              </svg>
              <span class="text">Play</span>
            </button>
            <!-- Trailer Overlay -->
            ${
              trailer
                ? `
              <div class="trailer-overlay">
                <iframe
                  width="560"
                  height="315"
                  src="https://www.youtube.com/embed/${trailer.key}"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                ></iframe>
              </div>
            `
                : ""
            }
          </div>
          <!-- Movie Details -->
          <div class="p-6">
            <h2 class="text-2xl font-bold mb-2 font-serif">${
              movieDetails.title
            }</h2>
            <div class="flex items-center gap-2 text-sm text-gray-400 mb-4">
              <span>${movieDetails.release_date}</span>
              <span>•</span>
              <span>${movieDetails.runtime} mins</span>
              <span>•</span>
              <span>${movieDetails.genres
                .map((genre) => genre.name)
                .join(", ")}</span>
            </div>
            <p class="text-gray-300 mb-4">${movieDetails.overview}</p>
            <div class="space-y-2">
              <p class="text-gray-400"><span class="font-semibold">Director:</span> ${director}</p>
              <p class="text-gray-400"><span class="font-semibold">Cast:</span> ${cast}</p>
              <div class="flex items-center gap-2">
                <span class="text-yellow-500">★</span>
                <span class="font-semibold">${movieDetails.vote_average.toFixed(
                  1
                )}</span>
                <span class="text-gray-400">/ 10</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Adjust the image size dynamically
    const img = movieResult.querySelector(".movie-image-container img");
    if (img) {
      img.onload = () => adjustImageSize(img);
    }

    // Add event listener to keep video visible when playing
    if (trailer) {
      const trailerOverlay = movieResult.querySelector(".trailer-overlay");
      const iframe = trailerOverlay.querySelector("iframe");
      const movieImageContainer = movieResult.querySelector(
        ".movie-image-container"
      );
      const playButton = movieResult.querySelector(".play-button");

      // Show overlay and hide play button when play button is clicked
      playButton.addEventListener("click", () => {
        trailerOverlay.classList.add("visible");
        movieImageContainer.classList.add("playing");
        iframe.src += "?autoplay=1"; // Start playing the trailer
      });

      // Show overlay and hide play button when video starts playing
      iframe.addEventListener("play", () => {
        trailerOverlay.classList.add("visible");
        movieImageContainer.classList.add("playing");
      });

      // Hide overlay and show play button when video is paused or ends
      iframe.addEventListener("pause", () => {
        trailerOverlay.classList.remove("visible");
        movieImageContainer.classList.remove("playing");
      });

      iframe.addEventListener("ended", () => {
        trailerOverlay.classList.remove("visible");
        movieImageContainer.classList.remove("playing");
      });
    }

    checkmarkContainer.classList.remove("hidden");
  } catch (err) {
    errorMessage.textContent = `Error: ${err.message}`;
    errorMessage.classList.remove("hidden");
    movieResult.innerHTML =
      '<p class="text-xl">Select a genre to discover your next favorite movie</p>';
  } finally {
    discoverButton.disabled = false;
    discoverButton.textContent = "Discover Movie";
  }
});

// Load genres when the page loads
loadGenres();
