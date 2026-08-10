const AdminStaff = {
  components: {
    AdminLayout: window.AdminLayout,
    TableComponent: window.TableComponent
  },

  data() {
    return {
      adminName: "Admin",

      activeTab: "pending",

      counts: {
        pending: 0,
        approved: 0,
        blacklisted: 0
      },

      staffMembers: []
    };
  },
  
  emits: ["navigate", "logout"],

  methods: {
    async loadStaff(tab = "pending") {
      try {
        const response = await fetch(`/api/admin/staff?tab=${tab}`, {
          credentials: "include"
        });

        const result = await response.json();

        if (result.success) {
          this.activeTab = result.data.active_tab || tab;
          this.counts = result.data.counts || this.counts;
          this.staffMembers = result.data.staff_members || [];

          if (result.data.admin_name) {
            this.adminName = result.data.admin_name;
          }
        } else {
          alert(result.message || "Failed to load staff members");
        }

      } catch (err) {
        console.error(err);
        alert("Unable to connect to the server");
      }
    },

    async updateStaffStatus(staffId, action) {
      try {
        const response = await fetch(`/api/admin/staff/${staffId}/${action}`, {
          method: "POST",
          credentials: "include"
        });

        const result = await response.json();

        if (result.success) {
          this.loadStaff(this.activeTab);
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
    this.loadStaff("pending");
  },

  template: `
    <admin-layout
      active-page="staff"
      :admin-name="adminName"
      @navigate="navigate"
      @logout="logout"
    >

      <h2 class="mb-4">Staff Requests</h2>

      <div class="d-flex gap-2 mb-4">

        <button
          class="btn"
          :class="activeTab === 'pending' ? 'btn-primary' : 'btn-outline-dark'"
          @click="loadStaff('pending')"
        >
          Pending ({{ counts.pending }})
        </button>

        <button
          class="btn"
          :class="activeTab === 'approved' ? 'btn-primary' : 'btn-outline-dark'"
          @click="loadStaff('approved')"
        >
          Approved ({{ counts.approved }})
        </button>

        <button
          class="btn"
          :class="activeTab === 'blacklisted' ? 'btn-primary' : 'btn-outline-dark'"
          @click="loadStaff('blacklisted')"
        >
          Blacklisted ({{ counts.blacklisted }})
        </button>

      </div>

      <table-component
        :headers="['Staff ID', 'Name', 'Email', 'Contact', 'Status', 'Action']"
        :keys="['id', 'name', 'email', 'contact', 'status', 'actions']"
        :data="staffMembers"
      >

        <template #actions="{ item }">

          <div class="d-flex justify-content-center gap-2">

            <template v-if="activeTab === 'pending'">

              <button
                class="btn btn-success btn-sm"
                @click="updateStaffStatus(item.raw_id, 'approve')"
              >
                Approve
              </button>

              <button
                class="btn btn-danger btn-sm"
                @click="updateStaffStatus(item.raw_id, 'reject')"
              >
                Reject
              </button>

            </template>

            <template v-else-if="activeTab === 'approved'">

              <button
                class="btn btn-outline-danger btn-sm"
                @click="updateStaffStatus(item.raw_id, 'blacklist')"
              >
                Blacklist
              </button>

            </template>

            <template v-else>

              <button
                class="btn btn-outline-success btn-sm"
                @click="updateStaffStatus(item.raw_id, 'approve')"
              >
                Restore
              </button>

            </template>

          </div>

        </template>

      </table-component>

    </admin-layout>
  `
};

window.AdminStaff = AdminStaff;