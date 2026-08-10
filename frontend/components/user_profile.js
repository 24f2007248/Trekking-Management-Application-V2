const UserProfile = {
  components: {
    UserLayout: window.UserLayout
  },

  data() {
    return {
      userName: "User Member",

      user: {
        userid: "",
        name: "",
        email: "",
        phone: ""
      },

      totalBookings: 0,
      completedTreks: 0
    };
  },

  methods: {
    async loadProfile() {
      try {
        const response = await fetch("/api/user/profile", {
          credentials: "include"
        });

        const result = await response.json();

        if (result.success) {
          this.user = result.data.user;
          this.totalBookings = result.data.total_bookings;
          this.completedTreks = result.data.completed_treks;
          this.userName = result.data.user.name;
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
        const response = await fetch("/api/user/profile", {
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
          this.userName = this.user.name;
          alert("Profile updated successfully");
        } else {
          alert(result.message || "Failed to update profile");
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
    this.loadProfile();
  },

  template: `
    <user-layout
      active-page="profile"
      :user-name="userName"
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

                  <label class="form-label">User ID</label>

                  <input
                    type="text"
                    class="form-control"
                    :value="user.userid"
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

                  <label class="form-label">Total Bookings</label>

                  <input
                    type="text"
                    class="form-control"
                    :value="totalBookings"
                    readonly
                  >

                </div>

                <div class="mb-3">

                  <label class="form-label">Completed Treks</label>

                  <input
                    type="text"
                    class="form-control"
                    :value="completedTreks"
                    readonly
                  >

                </div>

              </div>

            </div>

            <div class="text-end mt-3">

              <button
                type="submit"
                class="btn btn-primary"
              >
                Save Changes
              </button>

            </div>

          </form>

        </div>

      </div>

    </user-layout>
  `
};

window.UserProfile = UserProfile;