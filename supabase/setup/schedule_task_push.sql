-- Configure Vault secrets trenio_push_function_url and trenio_push_cron_secret first.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

do $$
begin
  if (select count(*) from vault.secrets where name in ('trenio_push_function_url', 'trenio_push_cron_secret')) <> 2 then
    raise exception 'Configure the two push scheduling secrets in Vault first';
  end if;
end;
$$;

select cron.schedule('trenio-dispatch-task-push', '* * * * *', $job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'trenio_push_function_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-trenio-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'trenio_push_cron_secret')
    ),
    timeout_milliseconds := 20000
  );
$job$);
