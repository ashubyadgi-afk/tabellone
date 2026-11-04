export function AuthBrandPane({ showDemoLogins = false }: { showDemoLogins?: boolean }) {
  return (
    <div className="tabellone-pane hidden w-1/2 shrink-0 lg:flex lg:flex-col lg:justify-between lg:p-12">
      <span className="tabellone-gradient w-fit self-start text-4xl font-bold tracking-tight">
        tabellone
      </span>
      <div>
        <h2 className="text-3xl font-bold text-white">Your advertising ecosystem</h2>
        <p className="mt-4 leading-relaxed text-white/80">
          Owners manage inventory. Advertisers book campaigns. Admins oversee the marketplace.
        </p>
      </div>
      {showDemoLogins ? (
        <div className="space-y-2 text-sm text-white/75">
          <p>Demo owner: owner@demo.tabellone.com / demo1234</p>
          <p>Demo advertiser: advertiser@demo.tabellone.com / demo1234</p>
          <p>Demo admin: admin@tabellone.com / admin1234</p>
        </div>
      ) : (
        <div />
      )}
    </div>
  );
}
