const UserLayout = {
  props: {
    activePage: {
      type: String,
      default: "dashboard"
    },
    userName: {
      type: String,
      default: "User Member"
    }
  },

  template: `
    <div class="min-vh-100 d-flex flex-column">

      <header class="navbar navbar-dark sticky-top bg-dark-transparent px-4 py-3">
        <a
          href="#"
          class="navbar-brand fs-5 fw-bold"
          @click.prevent="$emit('navigate', 'user-dashboard')"
        >
          Trekking Management Application
        </a>

        <div class="text-white d-flex align-items-center gap-2">
          <i class="bi bi-person-circle fs-5"></i>
          <span>{{ userName }}</span>
        </div>
      </header>

      <div class="container-fluid flex-grow-1 d-flex p-0">

        <nav class="sidebar py-4 px-3 d-flex flex-column justify-content-between">

          <ul class="bg-white border rounded-3 nav nav-pills flex-column mb-auto gap-2">

            <li class="nav-item">
              <a
                href="#"
                class="nav-link d-flex align-items-center gap-3"
                :class="{ active: activePage === 'dashboard' }"
                @click.prevent="$emit('navigate', 'user-dashboard')"
              >
                <i class="bi bi-house-door-fill"></i>
                Dashboard
              </a>
            </li>

            <li class="nav-item">
              <a
                href="#"
                class="nav-link d-flex align-items-center gap-3"
                :class="{ active: activePage === 'treks' }"
                @click.prevent="$emit('navigate', 'user-treks')"
              >
                <i class="bi bi-tree-fill"></i>
                Browse Treks
              </a>
            </li>

            <li class="nav-item">
              <a
                href="#"
                class="nav-link d-flex align-items-center gap-3"
                :class="{ active: activePage === 'bookings' }"
                @click.prevent="$emit('navigate', 'user-bookings')"
              >
                <i class="bi bi-calendar-check-fill"></i>
                My Bookings
              </a>
            </li>

            <li class="nav-item">
              <a
                href="#"
                class="nav-link d-flex align-items-center gap-3"
                :class="{ active: activePage === 'history' }"
                @click.prevent="$emit('navigate', 'user-history')"
              >
                <i class="bi bi-clock-history"></i>
                History
              </a>
            </li>

            <li class="nav-item">
              <a
                href="#"
                class="nav-link d-flex align-items-center gap-3"
                :class="{ active: activePage === 'profile' }"
                @click.prevent="$emit('navigate', 'user-profile')"
              >
                <i class="bi bi-person-fill"></i>
                Profile
              </a>
            </li>

            <li class="nav-item border-top border-secondary pt-3">
              <a
                href="#"
                class="nav-link d-flex align-items-center gap-3 text-danger"
                @click.prevent="$emit('logout')"
              >
                <i class="bi bi-box-arrow-left"></i>
                Logout
              </a>
            </li>

          </ul>

        </nav>

        <main class="main-content flex-grow-1 p-4 p-md-5 overflow-auto">
          <slot></slot>
        </main>

      </div>

    </div>
  `
};

window.UserLayout = UserLayout;