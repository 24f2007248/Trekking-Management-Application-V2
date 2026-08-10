const StaffProfile = {
  components: {
    StaffLayout: window.StaffLayout
  },

  emits: ["navigate", "logout"],

  data() {
    return {
      staffName: "Staff Member",

      user: {
        name: "",
        email: "",
        phone: ""
      },

      staff: {
        staffid: "",
        approval_status: ""
      },

      assignedTrekCount: 0
    };
  },

  methods: {
    async loadProfile() {
      try {
        const response = await fetch("/api/staff/profile", {
          credentials: "include"
        });

        const result = await response.json();

        if (result.success) {
          this.user = result.data.user || this.user;
          this.staff = result.data.staff || this.staff;
          this.assignedTrekCount = result.data.assigned_trek_count || 0;
          this.staffName = this.user.name || "Staff Member";
        } else {
          alert(result.message || "Failed to load profile");
        }

      } catch (err) {
        console.error(err);
        alert("Unable to connect to the server");
      }
    },

    async saveProfile() {
      try {
        const response = await fetch("/api/staff/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            name: this.user.name,
            phone: this.user.phone
          })
        });

        const result = await response.json();

        if (result.success) {
          alert("Profile updated successfully");
          this.loadProfile();
        } else {
          alert(result.message || "Failed to update profile");
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
    this.loadProfile();
  },

  template: `
    <StaffLayout
      active-page="profile"
      :staff-name="staffName"
      @navigate="navigate"
      @logout="logout"
    >

      <h2 class="mb-4">My Profile</h2>

      <div class="card shadow-sm">
        <div class="card-body">

          <form @submit.prevent="saveProfile">

            <div class="row">

              <div class="col-md-6">

                <div class="mb-3">
                  <label class="form-label">Staff ID</label>
                  <input
                    type="text"
                    class="form-control"
                    :value="staff.staffid"
                    readonly
                  >
                </div>

                <div class="mb-3">
                  <label class="form-label">Full Name</label>
                  <input
                    type="text"
                    class="form-control"
                    v-model="user.name"
                    required
                  >
                </div>

                <div class="mb-3">
                  <label class="form-label">Email</label>
                  <input
                    type="email"
                    class="form-control"
                    :value="user.email"
                    readonly
                  >
                </div>

              </div>

              <div class="col-md-6">

                <div class="mb-3">
                  <label class="form-label">Phone Number</label>
                  <input
                    type="text"
                    class="form-control"
                    v-model="user.phone"
                    required
                  >
                </div>

                <div class="mb-3">
                  <label class="form-label">Approval Status</label>
                  <input
                    type="text"
                    class="form-control"
                    :value="staff.approval_status"
                    readonly
                  >
                </div>

                <div class="mb-3">
                  <label class="form-label">Assigned Treks</label>
                  <input
                    type="text"
                    class="form-control"
                    :value="assignedTrekCount"
                    readonly
                  >
                </div>

              </div>

            </div>

            <div class="text-end mt-3">
              <button type="submit" class="btn btn-primary">
                Save Changes
              </button>
            </div>

          </form>

        </div>
      </div>

    </StaffLayout>
  `
};

window.StaffProfile = StaffProfile;