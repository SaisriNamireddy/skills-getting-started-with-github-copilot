document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <p class="participants-header"><strong>Participants</strong></p>
            <ul class="participants-list">
              ${details.participants && details.participants.length
                ? details.participants.map(p => `
                    <li>
                      <span class="participant-email">${p}</span>
                      <button class="participant-remove" data-activity="${name}" data-email="${p}" aria-label="Remove ${p}">✖</button>
                    </li>
                  `).join('')
                : '<li class="no-participants">No participants yet</li>'}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);

        // Attach remove handlers for participants in this card
        activityCard.querySelectorAll('.participant-remove').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const email = btn.dataset.email;
            const activityName = btn.dataset.activity;
            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`,
                { method: 'DELETE' }
              );

              const result = await response.json();

              if (response.ok) {
                // Remove the participant from the DOM
                const li = btn.closest('li');
                if (li) li.remove();

                const list = activityCard.querySelector('.participants-list');
                if (!list.querySelector('li')) {
                  list.innerHTML = '<li class="no-participants">No participants yet</li>';
                }

                // Update availability count (increment by 1)
                const availability = activityCard.querySelector('.availability');
                const match = availability.textContent.match(/(\d+)/);
                if (match) {
                  const spots = parseInt(match[1], 10) + 1;
                  availability.innerHTML = `<strong>Availability:</strong> ${spots} spots left`;
                }
              } else {
                alert(result.detail || 'Failed to remove participant');
              }
            } catch (error) {
              console.error('Error removing participant:', error);
              alert('Failed to remove participant.');
            }
          });
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Update the UI to show the newly added participant without refresh
        try {
          const cards = activitiesList.querySelectorAll('.activity-card');
          let targetCard = null;
          cards.forEach(c => {
            const title = c.querySelector('h4');
            if (title && title.textContent.trim() === activity) targetCard = c;
          });

          if (targetCard) {
            const list = targetCard.querySelector('.participants-list');
            // avoid adding duplicates
            const exists = Array.from(list.querySelectorAll('.participant-email')).some(el => el.textContent === email);
            if (!exists) {
              // remove placeholder if present
              const placeholder = list.querySelector('.no-participants');
              if (placeholder) list.innerHTML = '';

              const li = document.createElement('li');
              const span = document.createElement('span');
              span.className = 'participant-email';
              span.textContent = email;
              const btn = document.createElement('button');
              btn.className = 'participant-remove';
              btn.dataset.activity = activity;
              btn.dataset.email = email;
              btn.setAttribute('aria-label', `Remove ${email}`);
              btn.textContent = '✖';
              li.appendChild(span);
              li.appendChild(btn);
              list.appendChild(li);

              // attach delete handler to the newly created button
              btn.addEventListener('click', async () => {
                try {
                  const resp = await fetch(
                    `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
                    { method: 'DELETE' }
                  );
                  const resJson = await resp.json();
                  if (resp.ok) {
                    const liNode = btn.closest('li');
                    if (liNode) liNode.remove();
                    const listNode = targetCard.querySelector('.participants-list');
                    if (!listNode.querySelector('li')) {
                      listNode.innerHTML = '<li class="no-participants">No participants yet</li>';
                    }
                    const availability = targetCard.querySelector('.availability');
                    const match = availability.textContent.match(/(\d+)/);
                    if (match) {
                      const spots = parseInt(match[1], 10) + 1;
                      availability.innerHTML = `<strong>Availability:</strong> ${spots} spots left`;
                    }
                  } else {
                    alert(resJson.detail || 'Failed to remove participant');
                  }
                } catch (err) {
                  console.error('Error removing participant:', err);
                  alert('Failed to remove participant.');
                }
              });

              // decrement availability count for the card
              const availability = targetCard.querySelector('.availability');
              const match = availability.textContent.match(/(\d+)/);
              if (match) {
                const spots = Math.max(0, parseInt(match[1], 10) - 1);
                availability.innerHTML = `<strong>Availability:</strong> ${spots} spots left`;
              }
            }
          }
        } catch (err) {
          console.error('Error updating UI after signup:', err);
        }
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
