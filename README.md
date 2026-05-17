# Mideye Travel Agency Website

## Project Overview

Mideye is a static travel agency website built for a Somalia-based service specializing in domestic flight booking and cargo shipping. The site is designed as an informational and booking interface, with a modern dark/gold theme inspired by premium travel brands.

## What the Project Includes

- `index.html`
  - Homepage with hero banner, service highlights, popular destination cards, client testimonials, and a booking call-to-action.
  - Uses a fixed navigation bar that changes background on scroll and highlights the active page.

- `booking.html`
  - Flight booking page with a booking form for passenger details, route selection, and travel date.
  - Includes client-side validation and simulated booking behavior via JavaScript.

- `cargo.html`
  - Cargo shipping page featuring cargo form and service details.

- `tracking.html`
  - Cargo tracking page where users can view shipment updates.

- `login.html` / `register.html`
  - Basic account access templates for login and registration.

- `admin.html`
  - Admin panel layout for managing bookings, cargo, or operational tasks.

- `style.css`
  - Primary stylesheet for layout, typography, buttons, section styling, and navbar behavior.

- `main.js`
  - Shared page script that controls navbar scroll behavior, active navigation highlighting, smooth anchor scrolling, and hero counter animations.

- `script.js`
  - Additional JavaScript file containing bespoke page interactions, including AOS initialization and form handling.

- `styles.css`
  - An additional stylesheet file, likely holding further theme or page-specific styles.

## How the Site Works

- Navigation is consistent across all pages, using the same navbar markup and CSS classes.
- The `main.js` script adds a `scrolled` class to the navbar after the page scroll threshold, making the header background visible on deeper content.
- The active navigation link is detected by comparing each link's `data-page` attribute to the current URL.
- `index.html` includes visual destination cards and hero statistics, plus animated page elements initialized by AOS.
- `booking.html` provides a booking form UX with validation logic and placeholder form submission behavior.

## What Is Still Missing

- Backend integration:
  - No database or server-side booking processing
  - Form submissions are currently simulated and do not persist data

- Authentication:
  - `login.html` and `register.html` are static templates without real user authentication or session management

- Tracking logic:
  - `tracking.html` appears to be a static status display rather than a connected tracking system

- Data management and API support:
  - No live flight/cargo pricing or real ticket availability
  - No real-time search or dynamic route filtering

- Code cleanup:
  - There are two JavaScript files (`main.js` and `script.js`) and two CSS files (`style.css` and `styles.css`), so there may be unused or duplicate resources.

## How to Run

1. Open any page directly in your browser (for example, `index.html`).
2. For best results, use a local static server if you want to preserve relative path behavior and avoid browser restrictions.
   - Example: `python3 -m http.server 8000` from the project folder
   - Then visit `http://localhost:8000`

## Recommended Next Steps

- Connect the booking and cargo forms to a backend REST API or Firebase
- Add real authentication and registration flow
- Implement actual tracking search based on shipment ID
- Consolidate CSS and JavaScript files to remove redundancy
- Improve accessibility and mobile performance

---

This README provides the current state of your travel website and highlights the main features plus the missing backend functionality. If you want, I can also add a second README section in Somali for local users.