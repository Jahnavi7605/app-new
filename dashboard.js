// Fetch username using AJAX
fetch('/get-username')
    .then(response => {
        if (response.ok) {
            return response.text();
        } else {
            throw new Error('User not authenticated');
        }
    })
    .then(username => {
        document.getElementById('welcome-message').textContent = 'Welcome ' + username;
    })
    .catch(error => {
        document.getElementById('welcome-message').textContent = 'User not authenticated';
    });

// Dropdown functionality
document.addEventListener("DOMContentLoaded", function() {
    var dropdowns = document.getElementsByClassName("dropdown");
    for (var i = 0; i < dropdowns.length; i++) {
        dropdowns[i].addEventListener("click", function() {
            this.classList.toggle("active");
            var dropdownContent = this.querySelector(".dropdown-content");
            if (dropdownContent.style.display === "block") {
                dropdownContent.style.display = "none";
            } else {
                dropdownContent.style.display = "block";
            }
        });
    }
});

// Open search popup
function openSearchPopup() {
    document.getElementById('search-popup').style.display = 'flex';
}

// Close search popup
function closeSearchPopup() {
    document.getElementById('search-popup').style.display = 'none';
}

// Image Carousel
document.addEventListener("DOMContentLoaded", function() {
    var slideIndex = 0;
    showSlides();

    function showSlides() {
        var slides = document.getElementsByClassName("carousel-slide");
        for (var i = 0; i < slides.length; i++) {
            slides[i].style.display = "none";
        }
        slideIndex++;
        if (slideIndex > slides.length) { slideIndex = 1 }
        slides[slideIndex - 1].style.display = "block";
        setTimeout(showSlides, 2000); // Change image every 2 seconds
    }

    // Navigation arrows
    var prevBtn = document.getElementById("prevBtn");
    var nextBtn = document.getElementById("nextBtn");

    prevBtn.addEventListener("click", function() {
        slideIndex--;
        showSlides();
    });

    nextBtn.addEventListener("click", function() {
        slideIndex++;
        showSlides();
    });
});
