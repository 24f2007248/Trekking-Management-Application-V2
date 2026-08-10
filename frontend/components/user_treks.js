const UserTreks = {
  components: {
    UserLayout: window.UserLayout,
    TableComponent: window.TableComponent
  },

  data() {
    return {
      userName: "User Member",

      treks: [],

      searchQuery: "",
      difficultyFilter: "All",

      currentPage: 1,
      totalPages: 1
    };
  },

  methods: {
    async loadTreks(page = 1) {
      try {
        const params = new URLSearchParams({
          page: page,
          search: this.searchQuery,
          difficulty: this.difficultyFilter
        });

        const response = await fetch(`/api/user/treks?${params.toString()}`, {
          credentials: "include"
        });

        const result = await response.json();

        if (result.success) {
          this.treks = result.data.treks || [];

          this.currentPage = result.data.pagination?.page || 1;
          this.totalPages = result.data.pagination?.total_pages || 1;

          if (result.data.user_name) {
            this.userName = result.data.user_name;
          }
        } else {
          alert(result.message || "Failed to load treks");
        }

      } catch (err) {
        console.error(err);
        alert("Unable to connect to the server");
      }
    },

    applyFilters() {
      this.loadTreks(1);
    },

    async bookTrek(trekId) {
      try {
        const response = await fetch(`/api/user/treks/${trekId}/book`, {
          method: "POST",
          credentials: "include"
        });

        const result = await response.json();

        if (result.success) {
          alert("Trek booked successfully");
          this.loadTreks(this.currentPage);
        } else {
          alert(result.message || "Booking failed");
        }

      } catch (err) {
        console.error(err);
        alert("Unable to connect to the server");
      }
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
    this.loadTreks();
  },

  template: `
    <user-layout
      active-page="treks"
      :user-name="userName"
      @navigate="navigate"
      @logout="logout"
    >

      <h2 class="mb-4">Browse Treks</h2>

      <div class="row mb-4">

        <div class="col-md-8 mb-3">

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

        <div class="col-md-4 mb-3">

          <select
            class="form-select"
            v-model="difficultyFilter"
            @change="applyFilters"
          >

            <option value="All">Difficulty: All</option>
            <option value="Easy">Easy</option>
            <option value="Moderate">Moderate</option>
            <option value="Hard">Hard</option>

          </select>

        </div>

      </div>

      <table-component
        :headers="[
          'Trek Name',
          'Location',
          'Difficulty',
          'Duration',
          'Available Slots',
          'Action'
        ]"
        :keys="[
          'name',
          'location',
          'difficulty',
          'duration',
          'slots',
          'actions'
        ]"
        :data="treks"
      >

        <template #actions="{ item }">

          <button
            class="btn btn-primary btn-sm"
            :disabled="item.slots <= 0 || item.status !== 'Open'"
            @click="bookTrek(item.raw_id)"
          >
            {{ item.slots <= 0 ? "Full" : item.status !== 'Open' ? "Unavailable" : "Book Now" }}
          </button>

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
              @click="loadTreks(currentPage - 1)"
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
              @click="loadTreks(page)"
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
              @click="loadTreks(currentPage + 1)"
            >
              <i class="bi bi-chevron-right"></i>
            </button>

          </li>

        </ul>

      </nav>

    </user-layout>
  `
};

window.UserTreks = UserTreks;