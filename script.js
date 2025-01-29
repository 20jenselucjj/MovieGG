// Debounce function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Display user-friendly error
const showError = (message) => {
  errorMessage.textContent = message;
  errorMessage.classList.remove("hidden");
};


const genreSelect = document.getElementById("genre");
const mediaTypeSelect = document.getElementById("media-type");
const discoverButton = document.getElementById("discover-button");
const checkmarkContainer = document.getElementById("checkmark-container");
const errorMessage = document.getElementById("error-message");
const movieResult = document.getElementById("movie-result");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const searchSuggestions = document.getElementById("search-suggestions");
const advancedFilterToggle = document.getElementById("advanced-filter-toggle");
const advancedFilters = document.getElementById("advanced-filters");
const yearFilter = document.getElementById("year");
const yearValue = document.getElementById("year-value");
const ratingFilter = document.getElementById("rating");
const ratingValue = document.getElementById("rating-value");
const popularityFilter = document.getElementById("popularity");
const popularityValue = document.getElementById("popularity-value");

const apiKey = "5a6c802c8add70016329db08b4995810"; // TMDb API key // TMDb API key from environment variable
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
      throw new Error(`Failed to load genres: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    const selectedMediaType = mediaTypeSelect.value; // Get the selected media type
    const genres = data.genres[selectedMediaType]; // Load genres based on media type
    populateGenreSelect(genres);
  } catch (err) {
    errorMessage.textContent = "Failed to load genres. Please refresh the page.";
    errorMessage.classList.remove("hidden");
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
  try {
    console.log("Fetching URL:", url);
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      } else if (response.status === 401) {
        throw new Error("Unable to authenticate with the movie database. Please check back later.");
      }
      throw new Error(`API request failed with status ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
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

// Display media details
const displayMediaDetails = (mediaDetails, creditsData, videosData, rating) => {
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
};

// Toggle advanced filters visibility
advancedFilterToggle.addEventListener("click", () => {
  advancedFilters.classList.toggle("hidden");
  if (advancedFilters.classList.contains("hidden")) {
    advancedFilterToggle.textContent = "Advanced Filters";
  } else {
    advancedFilterToggle.textContent = "Hide Advanced Filters";
  }
});

// Update filter values in real-time
yearFilter.addEventListener("input", () => {
  yearValue.textContent = yearFilter.value;
});

ratingFilter.addEventListener("input", () => {
  ratingValue.textContent = ratingFilter.value;
});

popularityFilter.addEventListener("input", () => {
  popularityValue.textContent = popularityFilter.value;
});

// Event listener for the "Discover" button
discoverButton.addEventListener("click", async () => {
  const selectedGenre = genreSelect.value;
  const selectedMediaType = mediaTypeSelect.value;
  const selectedYear = advancedFilters.classList.contains("hidden")
    ? ""
    : yearFilter.value;
  const selectedRating = advancedFilters.classList.contains("hidden")
    ? ""
    : ratingFilter.value;
  const selectedPopularity = advancedFilters.classList.contains("hidden")
    ? ""
    : popularityFilter.value;

  console.log("Selected Filters:", {
    genre: selectedGenre,
    mediaType: selectedMediaType,
    year: selectedYear,
    rating: selectedRating,
    popularity: selectedPopularity,
  }); // Log the selected filters

  if (!selectedGenre) {
    showError("Please select a genre first");
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

    // Add advanced filters if they are visible
    if (!advancedFilters.classList.contains("hidden")) {
      apiUrl += `&primary_release_year=${selectedYear}`; // Filter by release year
      apiUrl += `&vote_average.gte=${selectedRating}`; // Filter by minimum rating
      apiUrl += `&vote_count.gte=${selectedPopularity}`; // Filter by minimum popularity
    }

    console.log("API URL:", apiUrl); // Debugging: Log the API URL

    const discoverData = await fetchWithErrorHandling(apiUrl);

    console.log("API Response:", discoverData); // Debugging: Log the API response

    if (discoverData.results.length === 0) {
      throw new Error("No results found. Try adjusting the filters.");
    }

    // Filter out media that has already been displayed
    const availableMedia = discoverData.results.filter(
      (media) => !displayedMedia.includes(media.id)
    );

    if (availableMedia.length === 0) {
      throw new Error(
        "No new results found. Try adjusting the filters or media type."
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
        "No rated results found. Try adjusting the filters or media type."
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

    displayMediaDetails(mediaDetails, creditsData, videosData, rating);

    checkmarkContainer.classList.remove("hidden");
  } catch (err) {
    console.error("Error in discoverButton event listener:", err); // Log the error
    showError(err.message);
    movieResult.innerHTML =
      '<p class="text-xl">Select a genre and media type to discover your next favorite</p>';
  } finally {
    discoverButton.disabled = false;
    discoverButton.textContent = "Discover";
  }
});

// Event listener for the "Search" button
searchButton.addEventListener("click", async () => {
  const query = searchInput.value.trim();

  console.log("Search Query:", query); // Log the search query

  if (!query) {
    showError("Please enter a search term");
    return;
  }

  searchButton.disabled = true;
  searchButton.textContent = "Searching...";
  errorMessage.classList.add("hidden");
  checkmarkContainer.classList.add("hidden");
  movieResult.innerHTML = "";

  try {
    const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(
      query
    )}&include_adult=false`;

    console.log("Search URL:", searchUrl); // Log the API URL

    const searchData = await fetchWithErrorHandling(searchUrl);

    console.log("API Response:", searchData); // Log the API response

    if (searchData.results.length === 0) {
      throw new Error("No results found. Try a different search term.");
    }

    // Filter out people (only show movies and TV shows)
    const filteredResults = searchData.results.filter(
      (result) => result.media_type !== "person"
    );

    if (filteredResults.length === 0) {
      throw new Error("No results found. Try a different search term.");
    }

    // Display the first result (you can modify this to show multiple results)
    const media = filteredResults[0];
    const mediaType = media.media_type === "movie" ? "movie" : "tv";

    const mediaDetails = await fetchWithErrorHandling(
      `https://api.themoviedb.org/3/${mediaType}/${media.id}?api_key=${apiKey}`
    );

    const creditsData = await fetchWithErrorHandling(
      `https://api.themoviedb.org/3/${mediaType}/${media.id}/credits?api_key=${apiKey}`
    );

    const videosData = await fetchWithErrorHandling(
      `https://api.themoviedb.org/3/${mediaType}/${media.id}/videos?api_key=${apiKey}`
    );

    const rating = await getRating(mediaType, media.id);

    displayMediaDetails(mediaDetails, creditsData, videosData, rating);

    checkmarkContainer.classList.remove("hidden");
  } catch (err) {
    console.error("Error searching for media:", err); // Log the error
    showError(err.message);
    movieResult.innerHTML =
      '<p class="text-xl">No results found. Try a different search term.</p>';
  } finally {
    searchButton.disabled = false;
    searchButton.textContent = "Search";
  }
});

// Live search functionality
searchInput.addEventListener("input", debounce(async (event) => {
  const query = event.target.value.trim();
  if (query.length < 3) {
    searchSuggestions.classList.add("hidden");
    return;
  }

  try {
    const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false`;
    const searchData = await fetchWithErrorHandling(searchUrl);

    if (searchData.results.length === 0) {
      searchSuggestions.classList.add("hidden");
      return;
    }

    // Filter out people (only show movies and TV shows)
    const filteredResults = searchData.results.filter(
      (result) => result.media_type !== "person"
    );

    if (filteredResults.length === 0) {
      searchSuggestions.classList.add("hidden");
      return;
    }

    // Display search suggestions
    searchSuggestions.innerHTML = filteredResults
      .slice(0, 5) // Show only the top 5 results
      .map(
        (result) => `
          <div 
            class="p-3 hover:bg-gray-700 cursor-pointer" 
            data-id="${result.id}" 
            data-type="${result.media_type}"
            role="option"
            aria-selected="false"
          >
            ${result.title || result.name} (${result.media_type})
          </div>
        `
      )
      .join("");

    searchSuggestions.classList.remove("hidden");
  } catch (err) {
    console.error("Error fetching search suggestions:", err);
    searchSuggestions.classList.add("hidden");
  }
}, 300));

// Event listener for clicking on search suggestions
searchSuggestions.addEventListener("click", async (event) => {
  const selectedSuggestion = event.target.closest("div");
  if (!selectedSuggestion) return;

  const mediaId = selectedSuggestion.dataset.id;
  const mediaType = selectedSuggestion.dataset.type;

  console.log("Selected Suggestion:", { mediaId, mediaType }); // Log the selected suggestion

  if (!mediaId || !mediaType) return;

  // Clear search input and hide suggestions
  searchInput.value = "";
  searchSuggestions.classList.add("hidden");

  // Show loading state
  searchButton.disabled = true;
  searchButton.textContent = "Searching...";
  errorMessage.classList.add("hidden");
  checkmarkContainer.classList.add("hidden");
  movieResult.innerHTML = "";

  try {
    // Fetch media details
    const mediaDetails = await fetchWithErrorHandling(
      `https://api.themoviedb.org/3/${mediaType}/${mediaId}?api_key=${apiKey}`
    );

    const creditsData = await fetchWithErrorHandling(
      `https://api.themoviedb.org/3/${mediaType}/${mediaId}/credits?api_key=${apiKey}`
    );

    const videosData = await fetchWithErrorHandling(
      `https://api.themoviedb.org/3/${mediaType}/${mediaId}/videos?api_key=${apiKey}`
    );

    const rating = await getRating(mediaType, mediaId);

    // Display media details
    displayMediaDetails(mediaDetails, creditsData, videosData, rating);

    checkmarkContainer.classList.remove("hidden");
  } catch (err) {
    console.error("Error fetching media details:", err); // Log the error
    showError(err.message);
    movieResult.innerHTML =
      '<p class="text-xl">No results found. Try a different search term.</p>';
  } finally {
    searchButton.disabled = false;
    searchButton.textContent = "Search";
  }
});

// Hide suggestions when clicking outside
document.addEventListener("click", (event) => {
  if (
    !searchInput.contains(event.target) &&
    !searchSuggestions.contains(event.target)
  ) {
    searchSuggestions.classList.add("hidden");
  }
});

// Load genres when the page loads
loadGenres();

// Reload genres when the media type changes
mediaTypeSelect.addEventListener("change", () => {
  loadGenres();
});
