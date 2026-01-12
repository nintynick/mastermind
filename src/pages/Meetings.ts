// ============================================
// Meetings Page - Schedule & Attendance
// ============================================

import { formatDate } from '../lib/utils';
import type { MeetingType } from '../types';

const MEETING_TYPES: Record<MeetingType, { label: string; duration: number; description: string; color: string }> = {
  start_quarter: { label: 'Start of Quarter', duration: 40, description: 'Goal setting and planning', color: 'accent' },
  mid_quarter: { label: 'Mid Quarter', duration: 30, description: 'Progress review and adjustments', color: 'info' },
  end_quarter: { label: 'End of Quarter', duration: 40, description: 'Review and celebration', color: 'success' },
  start_week: { label: 'Start of Week', duration: 9, description: 'Task setting for the week', color: 'accent' },
  end_week: { label: 'End of Week', duration: 9, description: 'Weekly task review', color: 'success' },
};

// Demo meetings
const DEMO_MEETINGS = [
  { id: '1', type: 'start_week' as MeetingType, date: '2025-01-13', leader: 'Nick' },
  { id: '2', type: 'end_week' as MeetingType, date: '2025-01-17', leader: 'Charlie' },
  { id: '3', type: 'start_week' as MeetingType, date: '2025-01-20', leader: 'Chris' },
  { id: '4', type: 'mid_quarter' as MeetingType, date: '2025-02-10', leader: 'Nick' },
  { id: '5', type: 'end_quarter' as MeetingType, date: '2025-03-28', leader: 'Charlie' },
];

const DEMO_MEMBERS = [
  { id: '1', name: 'Nick', initials: 'N' },
  { id: '2', name: 'Charlie', initials: 'C' },
  { id: '3', name: 'Chris', initials: 'CR' },
];

const DEMO_ATTENDANCE_LOG = [
  { date: '2025-01-10', meeting: 'End of Week', absent: [], late: [] },
  { date: '2025-01-06', meeting: 'Start of Week', absent: [], late: ['Chris'] },
  { date: '2025-01-03', meeting: 'Start of Quarter', absent: [], late: [] },
];

export function renderMeetings(container: Element): void {
  const today = new Date();
  const nextMeeting = DEMO_MEETINGS.find(m => new Date(m.date) >= today);

  container.innerHTML = `
    <div class="container stagger">
      <div class="page-header">
        <h1 class="page-header__title">Meetings & Schedule</h1>
        <p class="page-header__subtitle">Mastermind group coordination</p>
      </div>

      <!-- Next Meeting -->
      ${nextMeeting ? `
        <section class="section">
          <div class="card" style="border: 1px solid var(--accent);">
            <div class="badge badge--accent mb-4">NEXT MEETING</div>
            <div class="flex items-start gap-6 flex-wrap">
              <div class="meeting-card__date" style="width: 80px; height: 80px;">
                <span class="meeting-card__day text-2xl">${new Date(nextMeeting.date).getDate()}</span>
                <span class="meeting-card__month">${new Date(nextMeeting.date).toLocaleDateString('en-US', { month: 'short' })}</span>
              </div>
              <div class="flex-1">
                <h2 class="text-xl font-semibold mb-2">${MEETING_TYPES[nextMeeting.type].label}</h2>
                <p class="text-secondary mb-4">${MEETING_TYPES[nextMeeting.type].description}</p>
                <div class="flex items-center gap-4 text-sm text-tertiary">
                  <span>${new Date(nextMeeting.date).toLocaleDateString('en-US', { weekday: 'long' })}</span>
                  <span>·</span>
                  <span>${MEETING_TYPES[nextMeeting.type].duration} minutes</span>
                  <span>·</span>
                  <span>Led by ${nextMeeting.leader}</span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <div class="avatar">${nextMeeting.leader.charAt(0)}</div>
                <span class="text-sm text-secondary">${nextMeeting.leader}</span>
              </div>
            </div>
          </div>
        </section>
      ` : ''}

      <!-- Meeting Types -->
      <section class="section">
        <div class="section__header">
          <h2 class="section__title">Meeting Types</h2>
        </div>

        <div class="grid gap-4" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
          ${Object.entries(MEETING_TYPES).map(([type, config]) => `
            <div class="card">
              <div class="flex items-start justify-between mb-3">
                <h3 class="font-semibold text-${config.color}">${config.label}</h3>
                <span class="badge">${config.duration} min</span>
              </div>
              <p class="text-sm text-secondary">${config.description}</p>
              <div class="text-xs text-tertiary mt-3">
                ${type.includes('week') ? 'Weekly' : 'Quarterly'}
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Upcoming Schedule -->
      <section class="section">
        <div class="section__header">
          <h2 class="section__title">Upcoming Schedule</h2>
        </div>

        <div class="card">
          <div class="flex flex-col gap-4">
            ${DEMO_MEETINGS.map(meeting => {
              const meetingDate = new Date(meeting.date);
              const isPast = meetingDate < today;
              const config = MEETING_TYPES[meeting.type];
              return `
                <div class="meeting-card ${isPast ? 'opacity-50' : ''}">
                  <div class="meeting-card__date">
                    <span class="meeting-card__day">${meetingDate.getDate()}</span>
                    <span class="meeting-card__month">${meetingDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                  </div>
                  <div class="meeting-card__info flex-1">
                    <div class="meeting-card__type">${config.label}</div>
                    <div class="meeting-card__meta">
                      ${meetingDate.toLocaleDateString('en-US', { weekday: 'long' })} · ${config.duration} min
                    </div>
                  </div>
                  <div class="meeting-card__leader">
                    <div class="avatar avatar--sm">${meeting.leader.charAt(0)}</div>
                    <span class="text-sm text-secondary hide-mobile">${meeting.leader}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </section>

      <!-- Call Leader Rotation -->
      <section class="section">
        <div class="section__header">
          <h2 class="section__title">Call Leader Rotation</h2>
        </div>

        <div class="card">
          <p class="text-secondary mb-4">The call leader rotates each week to share responsibility.</p>
          <div class="flex gap-4 flex-wrap">
            ${DEMO_MEMBERS.map((member, i) => `
              <div class="flex items-center gap-3 p-3 rounded ${i === 0 ? 'bg-elevated border border-accent' : 'bg-elevated'}">
                <div class="avatar ${i === 0 ? '' : 'opacity-50'}">${member.initials}</div>
                <div>
                  <div class="font-medium ${i === 0 ? 'text-accent' : ''}">${member.name}</div>
                  <div class="text-xs text-tertiary">${i === 0 ? 'Current leader' : `Week ${i + 1}`}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- Attendance Log -->
      <section class="section">
        <div class="section__header">
          <h2 class="section__title">Recent Attendance</h2>
        </div>

        <div class="card">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="text-align: left; padding: 0.75rem; color: var(--text-tertiary); font-weight: 500; border-bottom: 1px solid var(--border-subtle);">Date</th>
                <th style="text-align: left; padding: 0.75rem; color: var(--text-tertiary); font-weight: 500; border-bottom: 1px solid var(--border-subtle);">Meeting</th>
                <th style="text-align: left; padding: 0.75rem; color: var(--text-tertiary); font-weight: 500; border-bottom: 1px solid var(--border-subtle);">Absent</th>
                <th style="text-align: left; padding: 0.75rem; color: var(--text-tertiary); font-weight: 500; border-bottom: 1px solid var(--border-subtle);">Late</th>
              </tr>
            </thead>
            <tbody>
              ${DEMO_ATTENDANCE_LOG.map(log => `
                <tr>
                  <td style="padding: 0.75rem; border-bottom: 1px solid var(--border-subtle);">
                    <span class="mono text-sm">${formatDate(log.date)}</span>
                  </td>
                  <td style="padding: 0.75rem; border-bottom: 1px solid var(--border-subtle);">
                    ${log.meeting}
                  </td>
                  <td style="padding: 0.75rem; border-bottom: 1px solid var(--border-subtle);">
                    ${log.absent.length > 0
                      ? log.absent.map(n => `<span class="badge badge--warning">${n}</span>`).join(' ')
                      : '<span class="text-tertiary">—</span>'
                    }
                  </td>
                  <td style="padding: 0.75rem; border-bottom: 1px solid var(--border-subtle);">
                    ${log.late.length > 0
                      ? log.late.map(n => `<span class="badge">${n}</span>`).join(' ')
                      : '<span class="text-tertiary">—</span>'
                    }
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `;
}
