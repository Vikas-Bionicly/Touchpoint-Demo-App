import Icon from './Icon';

export default function PageHeader({
  title,
  headerClassName = 'headbar',
  titleClassName = '',
  showMore = true,
  moreLabel = 'more',
  onMore,
  right,
}) {
  return (
    <header className={headerClassName}>
      <h1 className={titleClassName}>{title}</h1>

      {/* Allows passing completely custom right-side content */}
      {right || (
        <>
          {showMore && (
            <button className="context-btn" aria-label={moreLabel} type="button" onClick={onMore}>
              <Icon name="more" />
            </button>
          )}
        </>
      )}
    </header>
  );
}

