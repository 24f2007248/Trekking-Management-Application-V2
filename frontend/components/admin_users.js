const AdminUsers = {
  components: {
    AdminLayout: window.AdminLayout,
    TableComponent: window.TableComponent
  },

  emits: ["navigate", "logout"],

  data() {
    return {
      adminName: "Admin",

      usersList: [],

      currentPage: 1,
      totalPages: 1
    };
  },

  methods: {
    async loadUsers(page = 1) {
      try {
        const response = await fetch(`/api/admin/users?page=${page}`, {
          credentials: "include"
        });

        const result = await response.json();

        if (result.success) {
          this.usersList = result.data.users || [];

          this.currentPage = result.data.pagination?.page || 1;
          this.totalPages = result.data.pagination?.total_pages || 1;
        } else {
          alert(result.message || "Failed to load users");
        }

      } catch (err) {
        console.error(err);
        alert("Unable to connect to the server");
      }
    },

    async toggleUserStatus(userId) {
      try {
        const response = await fetch(`/api/admin/users/${userId}/toggle`, {
          method: "POST",
          credentials: "include"
        });

        const result = await response.json();

        if (result.success) {
          this.loadUsers(this.currentPage);
        } else {
          alert(result.message || "Operation failed");
        }

      } catch (err) {
        console.error(err);
        alert("Unable to connect to the server");
      }
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
    this.loadUsers();
  },

  template: `
    <admin-layout
      active-page="users"
      :admin-name="adminName"
      @navigate="navigate"
      @logout="logout"
    >

      <h2 class="mb-4">Manage Users</h2>

      <table-component
        :headers="['User ID', 'Name', 'Email', 'Contact', 'Status', 'Actions']"
        :keys="['id', 'name', 'email', 'contact', 'status', 'actions']"
        :data="usersList"
      >

        <template #actions="{ item }">

          <button
            v-if="item.is_active"
            class="btn btn-outline-danger btn-sm"
            @click="toggleUserStatus(item.raw_id)"
          >
            <i class="bi bi-person-x"></i>
            Deactivate
          </button>

          <button
            v-else
            class="btn btn-outline-success btn-sm"
            @click="toggleUserStatus(item.raw_id)"
          >
            <i class="bi bi-person-check"></i>
            Activate
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
              @click="loadUsers(currentPage - 1)"
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
              @click="loadUsers(page)"
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
              @click="loadUsers(currentPage + 1)"
            >
              <i class="bi bi-chevron-right"></i>
            </button>

          </li>

        </ul>

      </nav>

    </admin-layout>
  `
};

window.AdminUsers = AdminUsers;