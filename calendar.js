const apiKey = "4097e111160ea3c27318e80b04263a31";

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
function getMonthDates(year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  return {
    start: startDate.toISOString().split("T")[0],
    end: endDate.toISOString().split("T")[0],
  };
}

function getMonthName(month) {
  return new Date(Date.UTC(2000, month - 1, 1)).toLocaleString("default", {
    month: "long",
  });
}

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

function setCachedData(year, month, data) {
  const cacheKey = `movies_${year}_` + (month < 10 ? `0${month}` : `${month}`);
  localStorage.setItem(
    cacheKey,
    JSON.stringify({ data, timestamp: Date.now() })
  );
}

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
      throw new Error("Failed to fetch movies");
    }
    const data = await response.json();
    const movies = data.results.filter((movie) => {
      if (!movie.release_date) {
        console.log(`Movie ${movie.title} has no release date.`);
        return false;
      }
      const releaseDate = new Date(movie.release_date);
      if (isNaN(releaseDate.getTime())) {
        console.log(
          `Movie ${movie.title} has invalid release date: ${movie.release_date}`
        );
        return false;
      }
      const monthCheck = releaseDate.getMonth() === month;
      const yearCheck = releaseDate.getFullYear() === year;
      return monthCheck && yearCheck;
    });
    setCachedData(year, month, movies);
    renderMovies(movies);
  } catch (error) {
    console.error("Error fetching movies:", error);
    errorMessage.classList.remove("hidden");
    loading.classList.add("hidden");
  }
}

function renderMovies(movies) {
  moviesList.innerHTML = "";

  if (movies.length === 0) {
    moviesList.innerHTML = "<p>No upcoming movies this month.</p>";
  } else {
    // Sort movies by release date in ascending order
    movies.sort((a, b) => new Date(a.release_date) - new Date(b.release_date));

    // Render movies in the same format
    movies.forEach((movie) => {
      const movieElement = document.createElement("div");
      movieElement.className = "movie";
      const posterPath = movie.poster_path || "/path/to/default/poster.jpg";
      movieElement.innerHTML = `
        <img src="https://image.tmdb.org/t/p/w185${posterPath}" alt="${movie.title}" loading="lazy">
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

function updateHeader() {
  calendarHeader.textContent = `${getMonthName(
    currentMonth + 1
  )} ${currentYear}`;
}

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
window.addEventListener("load", updateCalendar);
