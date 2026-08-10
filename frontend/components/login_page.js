const LoginPage = {
  template: `
    <div class="min-vh-100 d-flex justify-content-center align-items-center">

      <div class="login-box p-5 text-center rounded-4">

        <h1 class="display-4 text-white mb-4">Login</h1>

        <p
          v-if="error"
          class="text-danger small fw-bold mb-3"
        >
          {{ error }}
        </p>

        <form @submit.prevent="login">

          <div class="mb-3">

            <input
              type="email"
              class="form-control"
              placeholder="Email"
              v-model="email"
              required
            >

          </div>

          <div class="mb-4">

            <input
              type="password"
              class="form-control"
              placeholder="Password"
              v-model="password"
              required
            >

          </div>

          <button
            type="submit"
            class="btn btn-light w-100 py-2 fw-bold shadow-sm"
            :disabled="loading"
          >
            {{ loading ? 'Logging in...' : 'Login' }}
          </button>

        </form>

        <p class="mt-4 text-white small mb-0">

          Don't have an account?

          <a
            href="#"
            class="custom-link text-decoration-none"
            @click.prevent="$root.currentPage = 'register-page'"
          >
            Register here
          </a>

        </p>

      </div>

    </div>
  `,

  data() {
    return {
      email: '',
      password: '',
      error: '',
      loading: false
    };
  },

  methods: {

    async login() {

      this.error = '';
      this.loading = true;

      try {

        const response = await fetch('/api/auth/login', {

          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          credentials: 'include',

          body: JSON.stringify({

            email: this.email,
            password: this.password

          })

        });

        const result = await response.json();

        if (result.success) {

          const role = result.data.role;

          if (role === 'admin') {

            this.$root.currentPage = 'admin-dashboard';

          }

          else if (role === 'staff') {

            this.$root.currentPage = 'staff-dashboard';

          }

          else {

            this.$root.currentPage = 'user-dashboard';

          }

        }

        else {

          this.error = result.message || 'Login failed';

        }

      }

      catch (err) {

        this.error = 'Unable to connect to the server';

      }

      finally {

        this.loading = false;

      }

    }

  }

};

window.LoginPage = LoginPage;