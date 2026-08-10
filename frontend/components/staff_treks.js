const StaffTreks = {
  components: {
    StaffLayout: window.StaffLayout,
    TableComponent: window.TableComponent
  },

  emits: ["navigate", "logout"],

  data() {
    return {
      staffName: "Staff Member",

      assignedTreks: [],

      searchQuery: "",
      statusFilter: "All",

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
          status: this.statusFilter
        });

        const response = await fetch(`/api/staff/treks?${params.toString()}`, {
          credentials: "include"
        });

        const result = await response.json();

        if (result.success) {
          this.assignedTreks = result.data.treks || [];

          this.currentPage = result.data.pagination?.page || 1;
          this.totalPages = result.data.pagination?.total_pages || 1;

          this.searchQuery = result.data.filters?.search || this.searchQuery;
          this.statusFilter = result.data.filters?.status || this.statusFilter;
        } else {
          alert(result.message || "Failed to load assigned treks");
        }

      } catch (err) {
        console.error(err);
        alert("Unable to connect to the server");
      }
    },

    searchTreks() {
      this.loadTreks(1);
    },

    changeStatus() {
      this.loadTreks(1);
    },

    manageTrek(trekId) {
      this.$emit("navigate", "staff-manage-trek");
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
    this.loadTreks();
  },

  template: `
    <staff-layout
      active-page="treks"
      :staff-name="staffName"
      @navigate="navigate"
      @logout="logout"
    >

      <h2 class="mb-4">My Assigned Treks</h2>

      <div class="row mb-4">

        <div class="col-md-8 mb-3">

          <div class="input-group">

            <span class="input-group-text">
              <i class="bi bi-search"></i>
            </span>

            <input
              type="text"
              class="form-control"
              placeholder="Search assigned treks..."
              v-model="searchQuery"
              @keyup.enter="searchTreks"
            >

          </div>

        </div>

        <div class="col-md-4 mb-3">

          <select
            class="form-select"
            v-model="statusFilter"
            @change="changeStatus"
          >

            <option value="All">Status: All</option>
            <option value="Open">Open</option>
            <option value="Started">Started</option>
            <option value="Completed">Completed</option>
            <option value="Closed">Closed</option>

          </select>

        </div>

      </div>

      <table-component
        :headers="['Trek Name', 'Location', 'Difficulty', 'Slots', 'Status', 'Actions']"
        :keys="['name', 'location', 'difficulty', 'slots', 'status', 'actions']"
        :data="assignedTreks"
      >

        <template #actions="{ item }">

          <button
            class="btn btn-outline-primary btn-sm"
            @click="manageTrek(item.raw_id)"
          >
            Manage
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

    </staff-layout>
  `
};

window.StaffTreks = StaffTreks;