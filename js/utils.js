function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatDateTime(ms) {
  const date = new Date(ms);
  const options = {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Chicago'
  };
  return `Logged at:<br>${date.toLocaleString('en-US', options)} CST`;
}

        <div class="artist">${formatDateTime(log.loggedAt)}</div>
      </div>
    </div>
  `).join('');

  pagination.innerHTML = Array.from({ length: pageCount }, (_, i) => {
    const num = i + 1;
          <div class="artist">${formatDateTime(log.loggedAt)}</div>
        </div>
      </div>
    `;
  }).join('');

  pagination.innerHTML = Array.from({ length: pageCount }, (_, i) => {
    const num = i + 1;
    timeElems[0].textContent = formatTime(elapsed);
    timeElems[1].textContent = formatTime(total);
    fillBar.style.width = `${progress}%`;

    if (elapsed >= total) clearInterval(progressInterval);
  }, 1000);
}

            <div class="time">${formatTime(elapsed)}</div>
            <div class="bar"><div class="fill" style="width:${progress}%"></div></div>
            <div class="time">${formatTime(total)}</div>
          </div>
        </div>
      </div>
    `;
