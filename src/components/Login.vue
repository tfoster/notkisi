<template>
  <div class="login">
    <h1>Login</h1>
    <form class="ui form" v-bind=user>
      <div class="ui message error" v-bind:class="{ visible: status.unauthorized }">
        The credentials provided are invalid, please try again.
      </div>
      <div class="ui message error" v-bind:class="{ visible: status.error }">
        An error has occured. Please check your network connection and try again.
      </div>
      <div class="field" v-bind:class="{ error: status.unauthorized }">
        <label>Email Address</label>
        <input type="email" name="email-address"
          placeholder="first.last@sentient.ai" v-model=user.email>
      </div>
      <div class="field" v-bind:class="{ error: status.unauthorized }">
        <label>Password</label>
        <input type="password" name="password" v-model=user.password>
      </div>
      <button class="ui button primary" type="button"
              v-on:click=authenticate
              v-bind:class="{ loading: status.inProgress }"
              v-bind:disabled=status.inProgress>Submit</button>
    </form>
  </div>
</template>

<script>
export default {
  name: 'Login',
  data() {
    return {
      user: {
        email: '',
        password: '',
      },
      status: {
        inProgress: false,
        error: false,
        unauthorized: false,
      },
    };
  },
  methods: {
    clearStatus() {
      this.status = {
        error: false,
        unauthorized: false,
        inProgress: false,
      };
    },
    authenticate(e) {
      e.preventDefault();
      this.clearStatus();

      fetch('https://api.kisi.io/users/sign_in', {
        method: 'POST',
        mode: 'cors',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user: this.user }),
      })
        .then((response) => {
          if (!response.ok) {
            this.status.inProgress = false;
            if (response.status === 401) {
              this.status.unauthorized = true;
              return;
            }

            this.status.error = true;
            return;
          }

          response.text()
            .then((auth) => {
              this.status.inProgress = false;
              localStorage.setItem('notkisi_auth', auth);
              this.$router.push('/doors');
            })
            .catch(() => {
              this.status.inProgress = false;
              this.status.error = true;
            });
        })
        .catch(() => {
          this.status.inProgress = false;
          this.status.error = true;
        });
    },
  },
};
</script>

<style scoped>
</style>
