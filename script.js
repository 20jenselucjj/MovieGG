const genreSelect = document.getElementById("genre");
const mediaTypeSelect = document.getElementById("media-type");
const discoverButton = document.getElementById("discover-button");
const checkmarkContainer = document.getElementById("checkmark-container");
const errorMessage = document.getElementById("error-message");
const movieResult = document.getElementById("movie-result");

const apiKey = "4097e111160ea3c27318e80b04263a31"; // TMDb API key
let displayedMedia = []; // Track media that has already been displayed

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

// Load genres from data.json based on the selected media type
const loadGenres = async () => {
  try {
    const response = await fetch("./data.json"); // Ensure the path is correct
    if (!response.ok) {
      throw new Error("Failed to load genres");
    }
    const data = await response.json();
    const selectedMediaType = mediaTypeSelect.value; // Get the selected media type
    const genres = data.genres[selectedMediaType]; // Load genres based on media type
    populateGenreSelect(genres);
  } catch (err) {
    console.error("Error loading genres:", err);
  }
};

// Populate the genre dropdown
const populateGenreSelect = (genres) => {
  genreSelect.innerHTML = '<option value="">Select a genre</option>'; // Clear existing options
  genres.forEach((genre) => {
    const option = document.createElement("option");
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

// Get the rating for a movie or TV show
const getRating = async (mediaType, mediaId) => {
  if (mediaType === "movie") {
    const releaseData = await fetchWithErrorHandling(
      `https://api.themoviedb.org/3/movie/${mediaId}/release_dates?api_key=${apiKey}`
    );
    const usRelease = releaseData.results.find(
      (release) => release.iso_3166_1 === "US"
    );
    return usRelease?.release_dates[0]?.certification || null;
  } else if (mediaType === "tv") {
    const contentRatings = await fetchWithErrorHandling(
      `https://api.themoviedb.org/3/tv/${mediaId}/content_ratings?api_key=${apiKey}`
    );
    const usRating = contentRatings.results.find(
      (rating) => rating.iso_3166_1 === "US"
    );
    return usRating?.rating || null;
  }
  return null;
};

// Event listener for the "Discover" button
discoverButton.addEventListener("click", async () => {
  const selectedGenre = genreSelect.value;
  const selectedMediaType = mediaTypeSelect.value;

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
    let apiUrl = `https://api.themoviedb.org/3/discover/${selectedMediaType}?api_key=${apiKey}&include_adult=false`;

    // Add genre and language filter for Japanese Anime
    if (selectedGenre === "16-ja") {
      apiUrl += "&with_genres=16&with_original_language=ja"; // Filter for Japanese anime
      apiUrl += "&with_keywords=210024|287501"; // Add anime-related keywords
    } else {
      apiUrl += `&with_genres=${selectedGenre}`; // Filter for other genres
    }

    // Lower the rating threshold for TV shows
    if (selectedMediaType === "tv") {
      apiUrl += "&vote_average.gte=5"; // Lower threshold for TV shows
    } else {
      apiUrl += "&vote_average.gte=6.5"; // Keep higher threshold for movies
    }

    console.log("API URL:", apiUrl); // Debugging: Log the API URL

    const discoverData = await fetchWithErrorHandling(apiUrl);

    console.log("API Response:", discoverData); // Debugging: Log the API response

    if (discoverData.results.length === 0) {
      throw new Error("No results found. Try a different genre or media type.");
    }

    // Filter out media that has already been displayed
    const availableMedia = discoverData.results.filter(
      (media) => !displayedMedia.includes(media.id)
    );

    if (availableMedia.length === 0) {
      throw new Error(
        "No new results found. Try a different genre or media type."
      );
    }

    // Try to find a rated media item
    let randomMedia;
    let rating;
    for (let i = 0; i < availableMedia.length; i++) {
      const randomIndex = Math.floor(Math.random() * availableMedia.length);
      randomMedia = availableMedia[randomIndex];
      rating = await getRating(selectedMediaType, randomMedia.id);

      if (rating) {
        break; // Found a rated media item
      } else {
        // Skip unrated media and try the next one
        availableMedia.splice(randomIndex, 1);
      }
    }

    if (!rating) {
      throw new Error(
        "No rated results found. Try a different genre or media type."
      );
    }

    displayedMedia.push(randomMedia.id);

    const mediaDetails = await fetchWithErrorHandling(
      `https://api.themoviedb.org/3/${selectedMediaType}/${randomMedia.id}?api_key=${apiKey}`
    );

    const creditsData = await fetchWithErrorHandling(
      `https://api.themoviedb.org/3/${selectedMediaType}/${randomMedia.id}/credits?api_key=${apiKey}`
    );

    const videosData = await fetchWithErrorHandling(
      `https://api.themoviedb.org/3/${selectedMediaType}/${randomMedia.id}/videos?api_key=${apiKey}`
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

    // Display the media details
    movieResult.innerHTML = `
      <div class="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div class="flex flex-col">
          <!-- Media Image with Trailer Hint -->
          <div class="movie-image-container">
            <img
              src="${
                mediaDetails.poster_path
                  ? `https://image.tmdb.org/t/p/w500${mediaDetails.poster_path}`
                  : "https://placehold.co/400x600"
              }"
              alt="${mediaDetails.title || mediaDetails.name}"
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
          <!-- Media Details -->
          <div class="p-6">
            <h2 class="text-2xl font-bold mb-2 font-serif">${
              mediaDetails.title || mediaDetails.name
            }</h2>
            <div class="flex items-center gap-2 text-sm text-gray-400 mb-4">
              <span>${
                mediaDetails.release_date || mediaDetails.first_air_date
              }</span>
              <span>•</span>
              <span>${
                mediaDetails.runtime ||
                mediaDetails.episode_run_time?.[0] ||
                "N/A"
              } mins</span>
              <span>•</span>
              <span>${mediaDetails.genres
                .map((genre) => genre.name)
                .join(", ")}</span>
              <span>•</span>
              <span>Rating: ${rating}</span> <!-- Display the rating -->
            </div>
            <p class="text-gray-300 mb-4">${mediaDetails.overview}</p>
            <div class="space-y-2">
              <p class="text-gray-400"><span class="font-semibold">Director:</span> ${director}</p>
              <p class="text-gray-400"><span class="font-semibold">Cast:</span> ${cast}</p>
              <div class="flex items-center gap-2">
                <span class="text-yellow-500">★</span>
                <span class="font-semibold">${mediaDetails.vote_average.toFixed(
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
      '<p class="text-xl">Select a genre and media type to discover your next favorite</p>';
  } finally {
    discoverButton.disabled = false;
    discoverButton.textContent = "Discover";
  }
});

// Load genres when the page loads
loadGenres();

// Reload genres when the media type changes
mediaTypeSelect.addEventListener("change", () => {
  loadGenres();
});
