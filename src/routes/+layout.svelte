<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { currentUser } from '$lib/stores/mock';
  import { 
    Home, 
    MessageSquare, 
    Bell, 
    User, 
    Menu, 
    Rocket,
    LayoutDashboard,
    Calendar,
    LogOut
  } from 'lucide-svelte';

  let isMenuOpen = false;

  $: activePath = $page.url.pathname;
  $: user = $currentUser;

  const navItems = [
    { label: 'ホーム', href: '/', icon: Home },
    { label: 'タイムライン', href: '/timeline', icon: Rocket },
    { label: 'プロジェクト', href: '/projects', icon: LayoutDashboard },
    { label: 'イベント', href: '/events', icon: Calendar },
  ];
</script>

<div class="min-h-screen flex flex-col">
  <!-- Navbar -->
  <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <!-- Logo & Desktop Nav -->
        <div class="flex">
          <div class="flex-shrink-0 flex items-center">
            <a href="/" class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              GrowthHach
            </a>
          </div>
          <div class="hidden sm:ml-8 sm:flex sm:space-x-8">
            {#each navItems as item}
              <a 
                href={item.href}
                class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium {activePath === item.href ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
              >
                <svelte:component this={item.icon} class="w-4 h-4 mr-2" />
                {item.label}
              </a>
            {/each}
          </div>
        </div>

        <!-- Right Side Icons -->
        <div class="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
          <a href="/messages" class="p-2 text-gray-400 hover:text-gray-500 relative">
            <MessageSquare class="w-6 h-6" />
            <!-- Notification Badge Mock -->
            <span class="absolute top-1 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white bg-red-500 transform translate-x-1/2 -translate-y-1/2"></span>
          </a>
          <a href="/notifications" class="p-2 text-gray-400 hover:text-gray-500">
            <Bell class="w-6 h-6" />
          </a>
          
          <!-- User Dropdown (Mock) -->
          <div class="ml-3 relative flex items-center gap-2">
            {#if user}
              <a href="/dashboard" class="flex items-center gap-2 hover:bg-gray-50 p-1 rounded-full pr-3 transition">
                <img class="h-8 w-8 rounded-full border border-gray-200" src={user.avatarUrl} alt="" />
                <span class="text-sm font-medium text-gray-700">{user.name}</span>
              </a>
            {:else}
              <a href="/login" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">ログイン</a>
            {/if}
          </div>
        </div>

        <!-- Mobile menu button -->
        <div class="flex items-center sm:hidden">
          <button 
            type="button" 
            class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            on:click={() => isMenuOpen = !isMenuOpen}
          >
            <Menu class="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Menu -->
    {#if isMenuOpen}
      <div class="sm:hidden bg-white border-t border-gray-200">
        <div class="pt-2 pb-3 space-y-1">
          {#each navItems as item}
            <a 
              href={item.href}
              class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium {activePath === item.href ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'}"
              on:click={() => isMenuOpen = false}
            >
              <div class="flex items-center">
                <svelte:component this={item.icon} class="w-5 h-5 mr-3" />
                {item.label}
              </div>
            </a>
          {/each}
          <a href="/messages" class="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700">
            <div class="flex items-center">
              <MessageSquare class="w-5 h-5 mr-3" />
              メッセージ
            </div>
          </a>
          <a href="/notifications" class="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700">
             <div class="flex items-center">
              <Bell class="w-5 h-5 mr-3" />
              通知
            </div>
          </a>
          <a href="/dashboard" class="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700">
             <div class="flex items-center">
              <User class="w-5 h-5 mr-3" />
              プロフィール
            </div>
          </a>
        </div>
      </div>
    {/if}
  </header>

  <!-- Main Content -->
  <main class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <slot />
  </main>

  <!-- Simple Footer -->
  <footer class="bg-white border-t border-gray-200 mt-auto">
    <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <p class="text-center text-sm text-gray-500">
        &copy; 2024 Growth Hach. Mock Version.
      </p>
    </div>
  </footer>
</div>
