const RegisterPage = {
  template: `
    <div class="min-vh-100 d-flex justify-content-center align-items-center">

      <div class="login-box p-5 text-center rounded-4">

        <h1 class="display-4 text-white mb-4">Register</h1>

        <p
          v-if="error"
          class="text-danger small fw-bold mb-3"
        >
          {{ error }}
        </p>

        <p
          v-if="success"
          class="text-success small fw-bold mb-3"
        >
          {{ success }}
        </p>

        <form @submit.prevent="register">

          <input
            type="text"
            class="form-control mb-3"
            placeholder="Full Name"
            v-model="name"
            required
          >

          <input
            type="email"
            class="form-control mb-3"
            placeholder="Email"
            v-model="email"
            required
          >

          <input
            type="text"
            class="form-control mb-3"
            placeholder="Phone Number"
            v-model="phone"
            required
          >

          <input
            type="password"
            class="form-control mb-3"
            placeholder="Password"
            v-model="password"
            required
          >

          <input
            type="password"
            class="form-control mb-4"
            placeholder="Confirm Password"
            v-model="confirmPassword"
            required
          >

          <div class="role-box mb-4">

            <label class="me-2 text-white">
              I am a
            </label>

            <select
              class="form-select d-inline-block w-auto"
              v-model="role"
              required
            >
              <option value="">
                -- Select Role --
              </option>

              <option value="user">
                User
              </option>

              <option value="staff">
                Staff
              </option>

            </select>

          </div>

          <button
            type="submit"
            class="btn btn-light w-100 py-2 fw-bold"
            :disabled="loading"
          >
            {{ loading ? 'Registering...' : 'Register' }}
          </button>

        </form>

        <p class="login-link mt-4 mb-0 text-white">

          Already have an account?

          <a
            href="#"
            @click.prevent="$root.currentPage = 'login-page'"
          >
            Login here
          </a>

        </p>

      </div>

    </div>
  `,

  data() {
    return {

      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: '',
      error: '',
      success: '',
      loading: false

    };
  },

  methods: {

    async register() {

      this.error = '';
      this.success = '';

      if (this.password !== this.confirmPassword) {

        this.error = 'Passwords do not match';

        return;

      }

      this.loading = true;

      try {

        const response = await fetch('/api/auth/register', {

          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          credentials: 'include',

          body: JSON.stringify({

            name: this.name,
            email: this.email,
            phone: this.phone,
            password: this.password,
            confirm_password: this.confirmPassword,
            role: this.role

          })

        });

        const result = await response.json();

        if (result.success) {

          this.success = 'Registration successful. Please login.';

          this.name = '';
          this.email = '';
          this.phone = '';
          this.password = '';
          this.confirmPassword = '';
          this.role = '';

          setTimeout(() => {

            this.$root.currentPage = 'login-page';

          }, 1200);

        }

        else {

          this.error = result.message || 'Registration failed';

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

window.RegisterPage = RegisterPage;