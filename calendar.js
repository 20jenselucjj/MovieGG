const apiKey = "5a6c802c8add70016329db08b4995810";

// Initialize to the current month and year
let today = new Date();
let currentMonth = today.getMonth() + 1; // Months are 0-indexed in JavaScript
let currentYear = today.getFullYear();

let isLoading = false;

// Elements
const calendarHeader = document.getElementById("calendar-header");
const prevMonthButton = document.getElementById("prev-month");
const nextMonthButton = document.getElementById("next-month");
const moviesList = document.getElementById("movies-list");
const loading = document.getElementById("loading");
const errorMessage = document.getElementById("error-message");

// Functions

/**
 * Get the start and end dates for a given month and year.
 * @param {number} year - The year.
 * @param {number} month - The month (1-12).
 * @returns {Object} - An object containing the start and end dates in YYYY-MM-DD format.
 */
function getMonthDates(year, month) {
  const startDate = new Date(Date.UTC(year, month - 1, 1)); // Start of the month in UTC
  const endDate = new Date(Date.UTC(year, month, 0)); // End of the month in UTC
  return {
    start: startDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
    end: endDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
  };
}

/**
 * Get the name of a month.
 * @param {number} month - The month (1-12).
 * @returns {string} - The name of the month.
 */
function getMonthName(month) {
  return new Date(Date.UTC(2000, month - 1, 1)).toLocaleString("default", {
    month: "long",
  });
}

/**
 * Get cached data for a specific month and year.
 * @param {number} year - The year.
 * @param {number} month - The month (1-12).
 * @returns {Array|null} - The cached data if available and not expired, otherwise null.
 */
function getCachedData(year, month) {
  const cacheKey = `movies_${year}_` + (month < 10 ? `0${month}` : `${month}`);
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
      return data;
    }
  }
  return null;
}

/**
 * Set cached data for a specific month and year.
 * @param {number} year - The year.
 * @param {number} month - The month (1-12).
 * @param {Array} data - The data to cache.
 */
function setCachedData(year, month, data) {
  const cacheKey = `movies_${year}_` + (month < 10 ? `0${month}` : `${month}`);
  localStorage.setItem(
    cacheKey,
    JSON.stringify({ data, timestamp: Date.now() })
  );
}

/**
 * Fetch movies for a specific month and year.
 * @param {number} year - The year.
 * @param {number} month - The month (1-12).
 */
async function fetchMovies(year, month) {
  const dates = getMonthDates(year, month);
  const cachedMovies = getCachedData(year, month);
  if (cachedMovies) {
    renderMovies(cachedMovies);
    return;
  }
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&release_date.gte=${dates.start}&release_date.lte=${dates.end}&include_adult=false&with_original_language=en`
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch movies: ${response.status} ${response.statusText}`
      );
    }
    const data = await response.json();
    const movies = data.results.filter((movie) => {
      if (!movie.release_date) {
        console.log(`Movie ${movie.title} has no release date.`);
        return false;
      }
      const releaseDate = new Date(movie.release_date + "T00:00:00Z"); // Parse as UTC
      if (isNaN(releaseDate.getTime())) {
        console.log(
          `Movie ${movie.title} has invalid release date: ${movie.release_date}`
        );
        return false;
      }
      const monthCheck = releaseDate.getUTCMonth() === month - 1; // Use getUTCMonth()
      const yearCheck = releaseDate.getUTCFullYear() === year; // Use getUTCFullYear()
      return monthCheck && yearCheck;
    });
    setCachedData(year, month, movies);
    renderMovies(movies);
  } catch (error) {
    console.error("Error fetching movies:", error);
    errorMessage.textContent = `Error: ${error.message}`;
    errorMessage.classList.remove("hidden");
    loading.classList.add("hidden");
  }
}

/**
 * Render movies to the DOM.
 * @param {Array} movies - The list of movies to render.
 */
function renderMovies(movies) {
  moviesList.innerHTML = "";

  if (movies.length === 0) {
    moviesList.innerHTML = "<p>No upcoming movies this month.</p>";
  } else {
    // Sort movies by release date in ascending order
    movies.sort((a, b) => new Date(a.release_date) - new Date(b.release_date));

    // Render movies
    movies.forEach((movie) => {
      const movieElement = document.createElement("div");
      movieElement.className = "movie";

      // Check if poster_path is available
      const posterPath = movie.poster_path
        ? `https://image.tmdb.org/t/p/w185${movie.poster_path}`
        : null; // No poster available

      // Render the movie with or without an image
      movieElement.innerHTML = `
        ${
          posterPath
            ? `<img src="${posterPath}" alt="${movie.title}" loading="lazy">`
            : ""
        }
        <h3>${movie.title}</h3>
        <p>Release Date: ${movie.release_date}</p>
      `;
      moviesList.appendChild(movieElement);
    });
  }

  // Hide the loading element once movies are rendered
  loading.classList.add("hidden");
  errorMessage.classList.add("hidden");
}
/**
 * Update the calendar header with the current month and year.
 */
function updateHeader() {
  calendarHeader.textContent = `${getMonthName(currentMonth)} ${currentYear}`;
}

/**
 * Update the calendar to display movies for the current month and year.
 */
function updateCalendar() {
  if (isLoading) return;
  isLoading = true;
  loading.classList.remove("hidden");
  moviesList.classList.add("hidden");
  fetchMovies(currentYear, currentMonth).then(() => {
    updateHeader();
    moviesList.classList.remove("hidden");
    isLoading = false;
  });
}

// Event Listeners
prevMonthButton.addEventListener("click", () => {
  currentMonth--;
  if (currentMonth < 1) {
    currentMonth = 12;
    currentYear--;
  }
  updateCalendar();
});

nextMonthButton.addEventListener("click", () => {
  currentMonth++;
  if (currentMonth > 12) {
    currentMonth = 1;
    currentYear++;
  }
  updateCalendar();
});

// Initialize
window.addEventListener("DOMContentLoaded", () => {
  updateCalendar();
});
