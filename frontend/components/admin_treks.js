const AdminTreks = {
  components: {
    AdminLayout: window.AdminLayout,
    TableComponent: window.TableComponent
  },

  emits: ["navigate", "logout"],

  data() {
    return {
      adminName: "Admin",
      treks: [],
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
          page,
          search: this.searchQuery,
          status: this.statusFilter
        });

        const response = await fetch(`/api/admin/treks?${params.toString()}`, {
          credentials: "include"
        });

        const result = await response.json();

        if (result.success) {
          this.treks = result.data.treks || [];
          this.currentPage = result.data.pagination?.page || 1;
          this.totalPages = result.data.pagination?.total_pages || 1;
        } else {
          alert(result.message || "Failed to load treks");
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

    async deleteTrek(trekId) {
      if (!confirm("Are you sure you want to delete this trek?")) return;

      try {
        const response = await fetch(`/api/admin/treks/${trekId}`, {
          method: "DELETE",
          credentials: "include"
        });

        const result = await response.json();

        if (result.success) {
          this.loadTreks(this.currentPage);
        } else {
          alert(result.message || "Failed to delete trek");
        }

      } catch (err) {
        console.error(err);
        alert("Unable to connect to the server");
      }
    },

    editTrek(trekId) {
      console.log("Setting selectedTrekId:", trekId);
      this.$root.selectedTrekId = trekId;
      this.$emit("navigate", "admin-edit-trek");
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
    <AdminLayout
      active-page="treks"
      :admin-name="adminName"
      @navigate="navigate"
      @logout="logout"
    >
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="mb-0">Manage Treks</h2>

        <button
          class="btn btn-primary"
          @click="navigate('admin-add-trek')"
        >
          <i class="bi bi-plus-lg"></i>
          Add New Trek
        </button>
      </div>

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

      <TableComponent
        :headers="['ID', 'Trek Name', 'Location', 'Difficulty', 'Slots', 'Status', 'Actions']"
        :keys="['id', 'name', 'location', 'difficulty', 'slots', 'status', 'actions']"
        :data="treks"
      >
        <template #actions="{ item }">
          <div class="d-flex justify-content-center gap-2">

            <button
              class="btn btn-outline-secondary btn-sm"
              title="Edit Trek"
              @click="editTrek(item.raw_id)"
            >
              <i class="bi bi-pencil"></i>
            </button>

            <button
              class="btn btn-outline-danger btn-sm"
              title="Delete Trek"
              @click="deleteTrek(item.raw_id)"
            >
              <i class="bi bi-trash"></i>
            </button>

          </div>
        </template>
      </TableComponent>

      <nav v-if="totalPages > 1" class="mt-4">
        <ul class="pagination justify-content-center">

          <li class="page-item" :class="{ disabled: currentPage === 1 }">
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

          <li class="page-item" :class="{ disabled: currentPage === totalPages }">
            <button
              class="page-link"
              @click="loadTreks(currentPage + 1)"
            >
              <i class="bi bi-chevron-right"></i>
            </button>
          </li>

        </ul>
      </nav>

    </AdminLayout>
  `
};

window.AdminTreks = AdminTreks;