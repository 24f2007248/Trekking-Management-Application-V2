const AdminBookings = {
  components: {
    AdminLayout: window.AdminLayout,
    TableComponent: window.TableComponent
  },

  emits: ["navigate", "logout"],

  data() {
    return {
      adminName: "Admin",

      bookings: [],

      currentPage: 1,
      totalPages: 1,
      searchQuery: ""
    };
  },

  methods: {
    async loadBookings(page = 1) {
      try {
        const params = new URLSearchParams({
          page: page,
          search: this.searchQuery
        });

        const response = await fetch(`/api/admin/bookings?${params.toString()}`, {
          credentials: "include"
        });

        const result = await response.json();

        if (result.success) {
          this.bookings = result.data.bookings || [];

          this.currentPage = result.data.pagination?.page || 1;
          this.totalPages = result.data.pagination?.total_pages || 1;

          this.searchQuery = result.data.filters?.search || this.searchQuery;
        } else {
          alert(result.message || "Failed to load bookings");
        }

      } catch (err) {
        console.error(err);
        alert("Unable to connect to the server");
      }
    },

    searchBookings() {
      this.loadBookings(1);
    },

    navigate(page) {
      this.$emit("navigate", page);
    },

    async logout() {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include"
        });
      } finally {
        this.$emit("logout");
      }
    }
  },

  mounted() {
    this.loadBookings();
  },

  template: `
    <AdminLayout
      active-page="bookings"
      :admin-name="adminName"
      @navigate="navigate"
      @logout="logout"
    >
      <h2 class="mb-4">Bookings</h2>

      <div class="row mb-4">
        <div class="col-md-8">
          <div class="input-group">
            <span class="input-group-text">
              <i class="bi bi-search"></i>
            </span>

            <input
              v-model="searchQuery"
              @keyup.enter="searchBookings"
              type="text"
              class="form-control"
              placeholder="Search by user or trek..."
            >

            <button
              class="btn btn-primary"
              @click="searchBookings"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      <TableComponent
        :headers="['Booking ID', 'User Name', 'Trek Title', 'Booking Date', 'Status']"
        :keys="['id', 'user_name', 'trek_title', 'booking_date', 'status']"
        :data="bookings"
      />

      <nav
        v-if="totalPages > 1"
        class="mt-4"
      >
        <ul class="pagination justify-content-center">

          <li
            class="page-item"
            :class="{ disabled: currentPage === 1 }"
          >
            <button
              class="page-link"
              @click="loadBookings(currentPage - 1)"
            >
              <i class="bi bi-chevron-left"></i>
            </button>
          </li>

          <li
            v-for="page in totalPages"
            :key="page"
            class="page-item"
            :class="{ active: page === currentPage }"
          >
            <button
              class="page-link"
              @click="loadBookings(page)"
            >
              {{ page }}
            </button>
          </li>

          <li
            class="page-item"
            :class="{ disabled: currentPage === totalPages }"
          >
            <button
              class="page-link"
              @click="loadBookings(currentPage + 1)"
            >
              <i class="bi bi-chevron-right"></i>
            </button>
          </li>

        </ul>
      </nav>

    </AdminLayout>
  `
};

window.AdminBookings = AdminBookings;