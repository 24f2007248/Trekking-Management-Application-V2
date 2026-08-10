const AdminLayout = {
  emits: ["navigate", "logout"],

  props: {
    activePage: {
      type: String,
      default: "dashboard"
    },
    adminName: {
      type: String,
      default: "Admin"
    }
  },

  template: `
  <div class="d-flex flex-column min-vh-100">

    <header class="navbar navbar-dark sticky-top bg-dark-transparent px-4 py-3">
      <a
        href="#"
        class="navbar-brand fs-5 fw-bold"
        @click.prevent="$emit('navigate', 'admin-dashboard')"
      >
        Trekking Management Application
      </a>

      <div class="text-white d-flex align-items-center gap-2">
        <i class="bi bi-person-circle fs-5"></i>
        <span>{{ adminName }}</span>
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
              @click.prevent="$emit('navigate', 'admin-dashboard')"
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
              @click.prevent="$emit('navigate', 'admin-treks')"
            >
              <i class="bi bi-tree-fill"></i>
              Treks
            </a>
          </li>

          <li class="nav-item">
            <a
              href="#"
              class="nav-link d-flex align-items-center gap-3"
              :class="{ active: activePage === 'staff' }"
              @click.prevent="$emit('navigate', 'admin-staff')"
            >
              <i class="bi bi-people-fill"></i>
              Staff
            </a>
          </li>

          <li class="nav-item">
            <a
              href="#"
              class="nav-link d-flex align-items-center gap-3"
              :class="{ active: activePage === 'users' }"
              @click.prevent="$emit('navigate', 'admin-users')"
            >
              <i class="bi bi-person-fill"></i>
              Users
            </a>
          </li>

          <li class="nav-item">
            <a
              href="#"
              class="nav-link d-flex align-items-center gap-3"
              :class="{ active: activePage === 'bookings' }"
              @click.prevent="$emit('navigate', 'admin-bookings')"
            >
              <i class="bi bi-calendar-check-fill"></i>
              Bookings
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

window.AdminLayout = AdminLayout;