const UserBookings = {
  components: {
    UserLayout: window.UserLayout,
    TableComponent: window.TableComponent
  },

  data() {
    return {
      userName: "User Member",

      bookings: [],

      history: false,

      searchQuery: "",
      statusFilter: "All",

      currentPage: 1,
      totalPages: 1
    };
  },

  methods: {
    async loadBookings(page = 1) {
      try {
        const params = new URLSearchParams({
          page: page,
          search: this.searchQuery,
          status: this.statusFilter,
          history: this.history ? "true" : "false"
        });

        const response = await fetch(`/api/user/bookings?${params.toString()}`, {
          credentials: "include"
        });

        const result = await response.json();

        if (result.success) {
          this.bookings = result.data.bookings || [];

          this.currentPage = result.data.pagination?.page || 1;
          this.totalPages = result.data.pagination?.total_pages || 1;

          if (result.data.user_name) {
            this.userName = result.data.user_name;
          }
        } else {
          alert(result.message || "Failed to load bookings");
        }

      } catch (err) {
        console.error(err);
        alert("Unable to connect to the server");
      }
    },

    applyFilters() {
      this.loadBookings(1);
    },

    viewBooking(trekId) {
      this.$root.selectedTrekId = trekId;
      this.$root.currentPage = "user-trek-details";
    },

    async cancelBooking(bookingId) {
      const confirmed = confirm("Are you sure you want to cancel this booking?");

      if (!confirmed) return;

      try {
        const response = await fetch(`/api/user/bookings/${bookingId}/cancel`, {
          method: "PATCH",
          credentials: "include"
        });

        const result = await response.json();

        if (result.success) {
          alert("Booking cancelled successfully");
          this.loadBookings(this.currentPage);
        } else {
          alert(result.message || "Failed to cancel booking");
        }

      } catch (err) {
        console.error(err);
        alert("Unable to connect to the server");
      }
    },

    async exportCSV() {

      try {

        const response = await fetch(
          "/api/user/bookings/export",
          {
            method: "POST",
            credentials: "include"
          }
        );

        const result = await response.json();

        if (!result.success) {
          alert(result.message || "Export failed");
          return;
        }

        const taskId = result.data.task_id;

        alert("Export started");

        this.pollExport(taskId);

      }

      catch (err) {

        console.error(err);
        alert("Unable to connect to the server");

      }

    },

    async pollExport(taskId) {

      const interval = setInterval(async () => {

        try {

          const response = await fetch(
            `/api/user/bookings/export/status/${taskId}`,
            {
              credentials: "include"
            }
          );

          const result = await response.json();

          if (!result.success) {

            clearInterval(interval);

            alert("Export failed");

            return;

          }

          const state = result.data.state;

          if (state === "SUCCESS") {

            clearInterval(interval);

            const filename = result.data.filename;

            window.location.href =
              `/api/user/bookings/export/download/${filename}`;

            alert("Export completed");

          }

          else if (state === "FAILURE") {

            clearInterval(interval);

            alert("Export failed");

          }

        }

        catch (err) {

          clearInterval(interval);

          console.error(err);

          alert("Unable to connect to the server");

        }

      }, 2000);

    },

    navigate(page) {
      this.$root.currentPage = page;
    },

    async logout() {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include"
        });
      } finally {
        this.$root.currentPage = "login-page";
      }
    }
  },

  mounted() {
    this.history = this.$root.historyMode || false;
    this.loadBookings();
  },

  template: `
    <user-layout
      :active-page="history ? 'history' : 'bookings'"
      :user-name="userName"
      @navigate="navigate"
      @logout="logout"
    >

      <h2 class="mb-4">{{ history ? 'History' : 'My Bookings' }}</h2>

      <div class="text-end mb-3">

        <button
          class="btn btn-success"
          @click="exportCSV"
        >
          <i class="bi bi-download"></i>
          Export Booking History (CSV)
        </button>

      </div>

      <div class="row mb-4">

        <div :class="history ? 'col-md-12 mb-3' : 'col-md-8 mb-3'">

          <div class="input-group">

            <span class="input-group-text">
              <i class="bi bi-search"></i>
            </span>

            <input
              type="text"
              class="form-control"
              placeholder="Search by trek name or location..."
              v-model="searchQuery"
              @keyup.enter="applyFilters"
            >

          </div>

        </div>

        <div
          v-if="!history"
          class="col-md-4 mb-3"
        >

          <select
            class="form-select"
            v-model="statusFilter"
            @change="applyFilters"
          >

            <option value="All">Trek Status: All</option>
            <option value="Open">Open</option>
            <option value="Started">Started</option>
            <option value="Completed">Completed</option>
            <option value="Closed">Closed</option>

          </select>

        </div>

      </div>

      <table-component
        v-if="history"
        :headers="[
          'Trek Name',
          'Location',
          'Booking Date',
          'Trek Status',
          'Booking Status'
        ]"
        :keys="[
          'trek_name',
          'location',
          'booking_date',
          'trek_status',
          'booking_status'
        ]"
        :data="bookings"
      ></table-component>

      <table-component
        v-else
        :headers="[
          'Trek Name',
          'Location',
          'Booking Date',
          'Trek Status',
          'Booking Status',
          'Action'
        ]"
        :keys="[
          'trek_name',
          'location',
          'booking_date',
          'trek_status',
          'booking_status',
          'actions'
        ]"
        :data="bookings"
      >

      <template #actions="{ item }">

        <div class="d-flex gap-2">

          <button
            class="btn btn-outline-primary btn-sm"
            @click="viewBooking(item.trek_id)"
          >
            View Details
          </button>

          <button
            v-if="item.booking_status === 'Booked'"
            class="btn btn-outline-danger btn-sm"
            @click="cancelBooking(item.booking_id)"
          >
            Cancel
          </button>

        </div>

      </template>

      </table-component>

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

    </user-layout>
  `
};


window.UserBookings = UserBookings;